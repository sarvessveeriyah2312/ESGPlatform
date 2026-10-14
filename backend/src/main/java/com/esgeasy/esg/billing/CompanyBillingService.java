package com.esgeasy.esg.billing;

import com.esgeasy.esg.activitylog.ActivityEventType;
import com.esgeasy.esg.activitylog.PlatformActivityLogService;
import com.esgeasy.esg.billing.dto.ChangePlanResponse;
import com.esgeasy.esg.billing.dto.CheckoutSessionResponse;
import com.esgeasy.esg.billing.dto.ConfirmCheckoutResponse;
import com.esgeasy.esg.billing.dto.CreateCheckoutSessionRequest;
import com.esgeasy.esg.billing.dto.NextBillingResponse;
import com.esgeasy.esg.common.exceptions.ConflictException;
import com.esgeasy.esg.common.exceptions.ForbiddenException;
import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.platform.PlatformSettingsService;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.CompanyRepository;
import com.esgeasy.esg.tenant.MarketClassification;
import com.esgeasy.esg.tenant.PlanPricing;
import com.esgeasy.esg.tenant.PlanPricingRepository;
import com.esgeasy.esg.tenant.SubscriptionPlan;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Self-serve plan management via Stripe. Two distinct paths depending on whether the company has
 * ever paid before (Company.stripeSubscriptionId is set):
 * <ul>
 *   <li>Never paid — {@link #createCheckoutSession} + {@link #confirmCheckout}, a hosted Stripe
 *       Checkout page (needed the first time since there's no saved payment method yet). No
 *       webhook for the confirm step: the platform's Stripe webhook secret being unset at launch
 *       meant confirmation had to happen by synchronously re-fetching the Checkout Session when
 *       the browser redirects back, rather than waiting on an async event — kept for consistency
 *       even now that a webhook exists (StripeWebhookService only handles cancellation/revocation).</li>
 *   <li>Already paying — {@link #changeSubscriptionPlan} modifies the existing subscription's
 *       price in place (with proration), so upgrading/downgrading never creates a second parallel
 *       subscription or a double-billing gap, and needs no checkout redirect at all.</li>
 * </ul>
 * Both paths keep {@code Company.subscriptionPlan} and {@code Company.marketClassification} in
 * sync (see {@link #marketFor}) — the rest of the app (matter-set resolution, indicator sets)
 * assumes those two are never out of step, same as onboarding's {@code AuthService.planForMarket}.
 */
@Service
public class CompanyBillingService {

    private final CompanyRepository companyRepository;
    private final PlanPricingRepository planPricingRepository;
    private final PlatformSettingsService platformSettingsService;
    private final PlatformStripeSecretProvider stripeSecretProvider;
    private final StripeClient stripeClient;
    private final CurrentUserProvider currentUserProvider;
    private final PlatformActivityLogService activityLogService;

    public CompanyBillingService(CompanyRepository companyRepository,
                                  PlanPricingRepository planPricingRepository,
                                  PlatformSettingsService platformSettingsService,
                                  PlatformStripeSecretProvider stripeSecretProvider,
                                  StripeClient stripeClient,
                                  CurrentUserProvider currentUserProvider,
                                  PlatformActivityLogService activityLogService) {
        this.companyRepository = companyRepository;
        this.planPricingRepository = planPricingRepository;
        this.platformSettingsService = platformSettingsService;
        this.stripeSecretProvider = stripeSecretProvider;
        this.stripeClient = stripeClient;
        this.currentUserProvider = currentUserProvider;
        this.activityLogService = activityLogService;
    }

    @Transactional(readOnly = true)
    public CheckoutSessionResponse createCheckoutSession(SubscriptionPlan targetPlan, CreateCheckoutSessionRequest.ReturnDestination returnTo) {
        UUID companyId = currentUserProvider.requireCompanyId();
        String secretKey = requireStripeSecretKey();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new NotFoundException("Company not found"));

        PlanPricing pricing = planPricingRepository.findById(targetPlan)
                .orElseThrow(() -> new NotFoundException("No pricing configured for plan: " + targetPlan));

        String baseUrl = platformSettingsService.getEffectiveAppBaseUrl();
        String returnPath = returnTo == CreateCheckoutSessionRequest.ReturnDestination.TRIAL_EXPIRED
                ? "/#/trial-expired" : "/#/settings?tab=billing";
        String joiner = returnPath.contains("?") ? "&" : "?";
        String successUrl = baseUrl + returnPath + joiner + "checkout=success&session_id={CHECKOUT_SESSION_ID}";
        String cancelUrl = baseUrl + returnPath + joiner + "checkout=cancelled";

        // ON_PREM bills annually rather than monthly — still a normal recurring Stripe
        // subscription (mode 'subscription'), just interval 'year' instead of 'month'. Stripe
        // handles renewal billing on its own from here; StripeWebhookService's
        // customer.subscription.deleted / invoice.payment_succeeded handlers are plan-agnostic
        // (matched by Stripe customer ID), so cancellation and each year's invoice are already
        // handled with no ON_PREM-specific code needed there.
        boolean annual = targetPlan == SubscriptionPlan.ON_PREM;

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("mode", "subscription");
        params.add("success_url", successUrl);
        params.add("cancel_url", cancelUrl);
        params.add("client_reference_id", companyId.toString());
        params.add("customer_email", currentUserProvider.getPrincipal().email());
        // Read back in confirmCheckout so it knows which plan to apply — this session might be
        // for a different plan than the company's current one (e.g. paying to start on Growth
        // directly, not just converting the current Starter trial).
        params.add("metadata[target_plan]", targetPlan.name());
        params.add("line_items[0][quantity]", "1");
        params.add("line_items[0][price_data][currency]", "myr");
        params.add("line_items[0][price_data][unit_amount]", toCents(pricing.getMonthlyPrice()));
        params.add("line_items[0][price_data][recurring][interval]", annual ? "year" : "month");
        params.add("line_items[0][price_data][product_data][name]", targetPlan.name() + " Plan — EsgEasy");
        applyPartnerRevenueShare(params, company);

        Map<String, Object> session = stripeClient.createCheckoutSession(secretKey, params);
        Object url = session.get("url");
        if (url == null) {
            throw new StripeException("Stripe didn't return a checkout URL");
        }
        return new CheckoutSessionResponse(url.toString());
    }

    @Transactional
    public ConfirmCheckoutResponse confirmCheckout(String sessionId) {
        UUID companyId = currentUserProvider.requireCompanyId();
        String secretKey = requireStripeSecretKey();

        Map<String, Object> session = stripeClient.retrieveCheckoutSession(secretKey, sessionId);
        Object clientReferenceId = session.get("client_reference_id");

        // A session belongs to exactly the company that created it — never trust a caller-supplied
        // sessionId without this check, or any authenticated user could confirm someone else's payment.
        if (clientReferenceId == null || !clientReferenceId.equals(companyId.toString())) {
            throw new ForbiddenException("This checkout session doesn't belong to your company");
        }

        Object paymentStatus = session.get("payment_status");
        if (!"paid".equals(paymentStatus)) {
            return new ConfirmCheckoutResponse(false, "Payment hasn't completed yet.");
        }

        // Locks the row for the rest of this transaction — if the browser fires this twice
        // concurrently for the same session (dev-mode double-effect, a double-click, two tabs),
        // the second call blocks here until the first commits, then re-reads its already-applied
        // state instead of racing it with a stale in-memory Company and clobbering the Stripe IDs
        // the first call just saved.
        Company company = companyRepository.findByIdForUpdate(companyId)
                .orElseThrow(() -> new NotFoundException("Company not found"));
        boolean wasConverted = Boolean.TRUE.equals(company.getTrialConverted());
        SubscriptionPlan previousPlan = company.getSubscriptionPlan();
        company.setTrialConverted(true);
        // Stored so StripeWebhookController can map a later "subscription cancelled"/"payment
        // failed" event back to this company and revoke trialConverted again.
        Object customerId = session.get("customer");
        Object subscriptionId = session.get("subscription");
        if (customerId != null) {
            company.setStripeCustomerId(customerId.toString());
        }
        if (subscriptionId != null) {
            company.setStripeSubscriptionId(subscriptionId.toString());
        }

        SubscriptionPlan targetPlan = readTargetPlanFromMetadata(session);
        if (targetPlan != null && targetPlan != previousPlan) {
            company.setSubscriptionPlan(targetPlan);
            company.setMarketClassification(marketFor(targetPlan));
        }

        companyRepository.save(company);
        if (!wasConverted) {
            activityLogService.record(company.getId(), company.getName(), ActivityEventType.TRIAL_CONVERTED,
                    "Converted to paid via Stripe Checkout");
        }
        if (targetPlan != null && targetPlan != previousPlan) {
            activityLogService.record(company.getId(), company.getName(), ActivityEventType.PLAN_CHANGE,
                    "Subscription plan changed from " + previousPlan + " to " + targetPlan + " via self-service checkout");
        }

        return new ConfirmCheckoutResponse(true, "Payment confirmed — your account is now active.");
    }

    /**
     * Modifies the price on the company's existing Stripe subscription in place (with immediate
     * proration) instead of creating a second, parallel one — the correct way to handle an
     * upgrade/downgrade once someone already has a saved payment method on file.
     */
    @Transactional
    public ChangePlanResponse changeSubscriptionPlan(SubscriptionPlan targetPlan) {
        // On-prem bills yearly while every other plan bills monthly — re-pricing a subscription
        // item in place (this endpoint) keeps the subscription's existing interval, so switching
        // to on-prem needs a fresh Checkout session (which sets interval 'year' from the start)
        // rather than an in-place item update. Known gap: this doesn't cancel the old monthly
        // subscription, so someone with an active Growth/Issuer-Ready subscription who then buys
        // on-prem via Checkout keeps being charged monthly for the old plan too, unless a platform
        // admin cancels it manually in Stripe — not handled automatically yet.
        if (targetPlan == SubscriptionPlan.ON_PREM) {
            throw new ConflictException("The on-premise plan bills annually — buy it via Checkout instead of changing your existing subscription");
        }
        UUID companyId = currentUserProvider.requireCompanyId();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new NotFoundException("Company not found"));

        if (company.getStripeSubscriptionId() == null) {
            throw new ConflictException("No active subscription to change — use Checkout to subscribe first");
        }
        if (company.getSubscriptionPlan() == targetPlan) {
            throw new IllegalArgumentException("Already on the " + targetPlan + " plan");
        }

        String secretKey = requireStripeSecretKey();
        PlanPricing pricing = planPricingRepository.findById(targetPlan)
                .orElseThrow(() -> new NotFoundException("No pricing configured for plan: " + targetPlan));

        Map<String, Object> subscription = stripeClient.retrieveSubscription(secretKey, company.getStripeSubscriptionId());
        String itemId = firstSubscriptionItemId(subscription);
        String productId = ensureStripeProduct(targetPlan, pricing, secretKey);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("items[0][id]", itemId);
        params.add("items[0][price_data][currency]", "myr");
        params.add("items[0][price_data][unit_amount]", toCents(pricing.getMonthlyPrice()));
        params.add("items[0][price_data][recurring][interval]", "month");
        // Unlike Checkout Session line items, this endpoint's inline price_data rejects
        // product_data (creating a product ad hoc) — confirmed live via Stripe: "Received unknown
        // parameter: items[0][price_data][product_data]". It requires an existing product id.
        params.add("items[0][price_data][product]", productId);
        // Charges/credits the prorated difference immediately rather than rolling it into the
        // next invoice — matches this app's "changes take effect immediately" behavior elsewhere
        // (e.g. PlanGateService re-reads the plan fresh on every request).
        params.add("proration_behavior", "always_invoice");

        stripeClient.updateSubscription(secretKey, company.getStripeSubscriptionId(), params);

        SubscriptionPlan previousPlan = company.getSubscriptionPlan();
        company.setSubscriptionPlan(targetPlan);
        company.setMarketClassification(marketFor(targetPlan));
        companyRepository.save(company);
        activityLogService.record(company.getId(), company.getName(), ActivityEventType.PLAN_CHANGE,
                "Subscription plan changed from " + previousPlan + " to " + targetPlan + " via self-service checkout");

        return new ChangePlanResponse(targetPlan, "Plan changed to " + targetPlan + ".");
    }

    /**
     * If this company was referred by a partner with both a connected
     * Stripe account and an explicit revenue share % set, route that share to the partner as a
     * destination charge on the resulting subscription — Stripe collects the full amount from the
     * customer and automatically transfers the fee-minus share to the partner's connected account.
     * Silently skipped (no destination charge) if either field is unset — see Partner.revenueSharePercent's
     * own doc comment for why there's no default percentage to fall back to. Nested under
     * subscription_data since this is a `mode=subscription` Checkout Session, not a one-off payment —
     * application_fee_percent/transfer_data at the top level only apply to `mode=payment`.
     */
    private void applyPartnerRevenueShare(MultiValueMap<String, String> params, Company company) {
        var partner = company.getPartner();
        if (partner == null || partner.getStripeAccountId() == null || partner.getRevenueSharePercent() == null) {
            return;
        }
        params.add("subscription_data[application_fee_percent]", partner.getRevenueSharePercent().toPlainString());
        params.add("subscription_data[transfer_data][destination]", partner.getStripeAccountId());
    }

    @SuppressWarnings("unchecked")
    private SubscriptionPlan readTargetPlanFromMetadata(Map<String, Object> session) {
        Object metadata = session.get("metadata");
        if (!(metadata instanceof Map)) {
            return null;
        }
        Object targetPlan = ((Map<String, Object>) metadata).get("target_plan");
        if (targetPlan == null) {
            return null;
        }
        try {
            return SubscriptionPlan.valueOf(targetPlan.toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    /**
     * The caller's own company's next billing date — read live from Stripe rather than stored,
     * since {@code changeSubscriptionPlan}'s proration can shift it. Null if the company has never
     * had an active subscription.
     */
    @Transactional(readOnly = true)
    public NextBillingResponse getNextBillingDate() {
        UUID companyId = currentUserProvider.requireCompanyId();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new NotFoundException("Company not found"));
        if (company.getStripeSubscriptionId() == null) {
            return new NextBillingResponse(null);
        }

        String secretKey = requireStripeSecretKey();
        Map<String, Object> subscription = stripeClient.retrieveSubscription(secretKey, company.getStripeSubscriptionId());
        // Stripe API 2025-06-30.basil moved current_period_end off the subscription object itself
        // and onto each subscription item (verified live via `stripe subscriptions list`) — same
        // items.data[0] path firstSubscriptionItemId already navigates for the item id.
        Object periodEnd = firstSubscriptionItem(subscription).get("current_period_end");
        if (!(periodEnd instanceof Number periodEndNumber)) {
            return new NextBillingResponse(null);
        }
        return new NextBillingResponse(epochSecondsToDate(periodEndNumber.longValue()));
    }

    /** Get-or-create — see PlanPricing.stripeProductId and StripeClient.createProduct for why this is needed. */
    private String ensureStripeProduct(SubscriptionPlan plan, PlanPricing pricing, String secretKey) {
        if (pricing.getStripeProductId() != null) {
            return pricing.getStripeProductId();
        }
        String productId = stripeClient.createProduct(secretKey, plan.name() + " Plan — EsgEasy");
        pricing.setStripeProductId(productId);
        planPricingRepository.save(pricing);
        return productId;
    }

    private String firstSubscriptionItemId(Map<String, Object> subscription) {
        Object id = firstSubscriptionItem(subscription).get("id");
        if (id == null) {
            throw new StripeException("Couldn't find a subscription item to update");
        }
        return id.toString();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> firstSubscriptionItem(Map<String, Object> subscription) {
        Object items = subscription.get("items");
        if (items instanceof Map) {
            Object data = ((Map<String, Object>) items).get("data");
            if (data instanceof List<?> list && !list.isEmpty() && list.get(0) instanceof Map<?, ?> firstItem) {
                return (Map<String, Object>) firstItem;
            }
        }
        throw new StripeException("Couldn't find a subscription item");
    }

    private LocalDate epochSecondsToDate(long epochSeconds) {
        return Instant.ofEpochSecond(epochSeconds).atZone(ZoneOffset.UTC).toLocalDate();
    }

    private MarketClassification marketFor(SubscriptionPlan plan) {
        return switch (plan) {
            case STARTER -> MarketClassification.SME;
            case GROWTH -> MarketClassification.ACE_MARKET;
            // On-prem's real target customer (bank, GLC, Main Market issuer)
            // is the same profile as ISSUER_READY's; a platform admin can correct this afterward
            // via the company's profile if a given purchaser doesn't fit that default.
            case ISSUER_READY, ON_PREM -> MarketClassification.MAIN_MARKET;
        };
    }

    // Extracted to PlatformStripeSecretProvider (shared with PartnerService's Stripe Connect
    // operations) — kept as a thin delegate here so the 4 existing
    // call sites in this class didn't need touching.
    private String requireStripeSecretKey() {
        return stripeSecretProvider.requireSecretKey();
    }

    private String toCents(BigDecimal ringgit) {
        return String.valueOf(ringgit.multiply(BigDecimal.valueOf(100)).intValueExact());
    }
}
