package com.esgeasy.esg.tenant;

import com.esgeasy.esg.activitylog.ActivityLogResponse;
import com.esgeasy.esg.activitylog.PlatformActivityLogService;
import com.esgeasy.esg.billing.InvoiceService;
import com.esgeasy.esg.billing.PlatformStripeSecretProvider;
import com.esgeasy.esg.billing.StripeClient;
import com.esgeasy.esg.billing.dto.InvoiceResponse;
import com.esgeasy.esg.common.exceptions.ConflictException;
import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.platform.PlatformSettingsService;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.support.SupportTicketService;
import com.esgeasy.esg.support.TicketMessageService;
import com.esgeasy.esg.support.TicketStatus;
import com.esgeasy.esg.support.dto.CreateTicketMessageRequest;
import com.esgeasy.esg.support.dto.SupportTicketResponse;
import com.esgeasy.esg.support.dto.TicketMessageResponse;
import com.esgeasy.esg.support.dto.UpdateTicketNoteRequest;
import com.esgeasy.esg.support.dto.UpdateTicketStatusRequest;
import com.esgeasy.esg.tenant.dto.CreatePartnerAdminUserRequest;
import com.esgeasy.esg.tenant.dto.CreatePartnerAdminUserResponse;
import com.esgeasy.esg.tenant.dto.PartnerBrandingResponse;
import com.esgeasy.esg.tenant.dto.PartnerCompanySummaryResponse;
import com.esgeasy.esg.tenant.dto.PartnerResponse;
import com.esgeasy.esg.tenant.dto.PartnerRevenueSummaryResponse;
import com.esgeasy.esg.tenant.dto.PartnerSecuritySettingsResponse;
import com.esgeasy.esg.tenant.dto.PartnerUserResponse;
import com.esgeasy.esg.tenant.dto.SavePartnerRequest;
import com.esgeasy.esg.tenant.dto.StripeConnectLinkResponse;
import com.esgeasy.esg.tenant.dto.StripeConnectStatusResponse;
import com.esgeasy.esg.tenant.dto.UpdatePartnerBrandingRequest;
import com.esgeasy.esg.tenant.dto.UpdatePartnerSecuritySettingsRequest;
import com.esgeasy.esg.user.AppUser;
import com.esgeasy.esg.user.AppUserRepository;
import com.esgeasy.esg.user.Role;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/** Platform-admin-only CRUD over {@link Partner} (plus its own login, WHITELABEL_PLAN.md Phase 4) — see PartnerController for the role check. */
@Service
public class PartnerService {

    private final PartnerRepository partnerRepository;
    private final CompanyRepository companyRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserProvider currentUserProvider;
    private final PlatformStripeSecretProvider stripeSecretProvider;
    private final StripeClient stripeClient;
    private final PlatformSettingsService platformSettingsService;
    private final InvoiceService invoiceService;
    private final SupportTicketService supportTicketService;
    private final TicketMessageService ticketMessageService;
    private final PlatformActivityLogService activityLogService;
    private final SecureRandom random = new SecureRandom();

    public PartnerService(PartnerRepository partnerRepository, CompanyRepository companyRepository,
                           AppUserRepository appUserRepository, PasswordEncoder passwordEncoder,
                           CurrentUserProvider currentUserProvider, PlatformStripeSecretProvider stripeSecretProvider,
                           StripeClient stripeClient, PlatformSettingsService platformSettingsService,
                           InvoiceService invoiceService, SupportTicketService supportTicketService,
                           TicketMessageService ticketMessageService, PlatformActivityLogService activityLogService) {
        this.partnerRepository = partnerRepository;
        this.companyRepository = companyRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUserProvider = currentUserProvider;
        this.stripeSecretProvider = stripeSecretProvider;
        this.stripeClient = stripeClient;
        this.platformSettingsService = platformSettingsService;
        this.invoiceService = invoiceService;
        this.supportTicketService = supportTicketService;
        this.ticketMessageService = ticketMessageService;
        this.activityLogService = activityLogService;
    }

    @Transactional(readOnly = true)
    public List<PartnerResponse> list() {
        return partnerRepository.findAllByOrderByNameAsc().stream().map(PartnerResponse::from).toList();
    }

    @Transactional
    public PartnerResponse create(SavePartnerRequest request) {
        Partner partner = new Partner();
        applyRequest(partner, request);
        return PartnerResponse.from(save(partner));
    }

    @Transactional
    public PartnerResponse update(UUID id, SavePartnerRequest request) {
        Partner partner = findPartner(id);
        applyRequest(partner, request);
        return PartnerResponse.from(save(partner));
    }

    @Transactional
    public void delete(UUID id) {
        Partner partner = findPartner(id);
        // Both FKs are ON DELETE SET NULL at the DB level, so this wouldn't actually fail — but
        // surfacing it as a deliberate choice (unlink/deactivate first) beats silently detaching
        // companies, or orphaning a login, from a partner an admin didn't realize was still in use.
        if (companyRepository.existsByPartnerId(id)) {
            throw new ConflictException("Unlink every company from this partner before deleting it");
        }
        if (appUserRepository.existsByPartnerId(id)) {
            throw new ConflictException("Deactivate this partner's login(s) before deleting it");
        }
        partnerRepository.delete(partner);
    }

    /** Platform-admin-only: creates the partner's own login (WHITELABEL_PLAN.md Phase 4) — there's no partner self-service yet, same posture as Phase 1. */
    @Transactional
    public CreatePartnerAdminUserResponse createPartnerAdminUser(UUID partnerId, CreatePartnerAdminUserRequest request) {
        Partner partner = findPartner(partnerId);
        if (appUserRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("An account with this email already exists");
        }

        String temporaryPassword = generateTemporaryPassword();

        AppUser user = new AppUser();
        user.setPartner(partner);
        user.setName(request.name());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        user.setRole(Role.PARTNER_ADMIN);
        user = appUserRepository.save(user);

        return CreatePartnerAdminUserResponse.from(user, temporaryPassword);
    }

    /** The signed-in partner's own scoped view of its companies — see CurrentUserProvider.requirePartnerId, PartnerConsoleController. */
    @Transactional(readOnly = true)
    public List<PartnerCompanySummaryResponse> listMyCompanies() {
        UUID partnerId = currentUserProvider.requirePartnerId();
        return companyRepository.findByPartnerIdOrderByNameAsc(partnerId).stream()
                .map(PartnerCompanySummaryResponse::from)
                .toList();
    }

    /** The signed-in partner's own editable presentation — see UpdatePartnerBrandingRequest for what's deliberately excluded (name/subdomain/billing/revenue share stay platform-admin-only). */
    @Transactional(readOnly = true)
    public PartnerBrandingResponse getMyBranding() {
        return PartnerBrandingResponse.from(findPartner(currentUserProvider.requirePartnerId()));
    }

    @Transactional
    public PartnerBrandingResponse updateMyBranding(UpdatePartnerBrandingRequest request) {
        Partner partner = findPartner(currentUserProvider.requirePartnerId());
        partner.setBrandName(request.brandName());
        partner.setLogoAsset(blankToNull(request.logoAsset()));
        partner.setPrimaryColor(blankToNull(request.primaryColor()));
        partner.setSupportEmail(blankToNull(request.supportEmail()));
        partner.setEmailFromAddress(blankToNull(request.emailFromAddress()));
        return PartnerBrandingResponse.from(save(partner));
    }

    /** Self-service variant of {@link #createPartnerAdminUser} — a partner inviting their own teammate rather than a platform admin bootstrapping the first login. */
    @Transactional
    public CreatePartnerAdminUserResponse inviteMyTeammate(CreatePartnerAdminUserRequest request) {
        return createPartnerAdminUser(currentUserProvider.requirePartnerId(), request);
    }

    @Transactional(readOnly = true)
    public List<PartnerUserResponse> listMyUsers() {
        UUID partnerId = currentUserProvider.requirePartnerId();
        return appUserRepository.findByPartnerIdOrderByNameAsc(partnerId).stream()
                .map(PartnerUserResponse::from)
                .toList();
    }

    /** Deactivate/reactivate a teammate under the caller's own partner — mirrors CompanyService.setUserActive's self-protection and last-active-login guard. */
    @Transactional
    public void setMyTeammateActive(UUID userId, boolean active) {
        UUID partnerId = currentUserProvider.requirePartnerId();
        AppUser target = appUserRepository.findById(userId)
                .filter(u -> u.getPartner() != null && partnerId.equals(u.getPartner().getId()))
                .orElseThrow(() -> new NotFoundException("User not found"));
        if (userId.equals(currentUserProvider.getPrincipal().userId())) {
            throw new ConflictException("You cannot deactivate your own login");
        }
        if (!active && appUserRepository.countByPartnerIdAndActiveTrue(partnerId) <= 1) {
            throw new ConflictException("Deactivate another teammate first — a partner needs at least one active login");
        }
        target.setActive(active);
        appUserRepository.save(target);
    }

    /**
     * Creates the partner's Stripe Express connected account on first call (reused on every
     * subsequent call, since Stripe account links are single-use/short-lived but the account
     * itself is permanent), then returns a fresh onboarding link. WHITELABEL_PLAN.md Phase 5 —
     * country is hardcoded to "MY" since every partner in this ESG-for-Bursa-Malaysia platform is
     * expected to be Malaysia-based.
     *
     * Verified live against this platform's own Stripe test account: the plain {@code type=express}
     * shape (which makes the PLATFORM liable for the connected account's losses/fees by default)
     * was rejected with "Platforms in MY cannot create accounts where the platform is loss-liable,
     * due to risk control measures" — Stripe restricts platform-liable Connect accounts for
     * Malaysia-domiciled platforms. Fixed by using the modern {@code controller} params instead of
     * the legacy {@code type} param — {@code controller[losses][payments]=stripe} and
     * {@code controller[fees][payer]=account} explicitly make the connected account (the partner)
     * liable for its own losses and fees rather than this platform, which is the workaround
     * Stripe's own error message links to. This also matches the actual business shape here: the
     * partner receives the revenue share, so it's the partner's account that should bear the
     * Stripe processing risk.
     */
    @Transactional
    public StripeConnectLinkResponse startStripeConnectOnboarding(UUID partnerId) {
        return startStripeConnectOnboarding(partnerId, "/#/admin/partners");
    }

    /** Self-service equivalent of {@link #startStripeConnectOnboarding(UUID)} — a partner completing their own onboarding rather than a platform admin doing it on their behalf. */
    @Transactional
    public StripeConnectLinkResponse startMyStripeConnectOnboarding() {
        return startStripeConnectOnboarding(currentUserProvider.requirePartnerId(), "/#/partner/revenue");
    }

    private StripeConnectLinkResponse startStripeConnectOnboarding(UUID partnerId, String returnBasePath) {
        Partner partner = findPartner(partnerId);
        String secretKey = stripeSecretProvider.requireSecretKey();

        if (partner.getStripeAccountId() == null) {
            MultiValueMap<String, String> accountParams = new LinkedMultiValueMap<>();
            accountParams.add("country", "MY");
            // controller[*] replaces the legacy type=express param (can't mix both in one request).
            // losses[payments]=stripe and fees[payer]=account make the connected account (the
            // partner) liable for its own losses/fees, not this platform — required for a
            // MY-domiciled platform, see this method's doc comment. stripe_dashboard[type]=express
            // keeps the same lightweight partner-facing dashboard type=express used to provide.
            accountParams.add("controller[losses][payments]", "stripe");
            accountParams.add("controller[fees][payer]", "account");
            accountParams.add("controller[stripe_dashboard][type]", "full");
            if (partner.getSupportEmail() != null) {
                accountParams.add("email", partner.getSupportEmail());
            }
            accountParams.add("capabilities[card_payments][requested]", "true");
            accountParams.add("capabilities[transfers][requested]", "true");
            accountParams.add("business_profile[name]", partner.getBrandName());

            Map<String, Object> account = stripeClient.createConnectedAccount(secretKey, accountParams);
            Object accountId = account.get("id");
            if (accountId == null) {
                throw new ConflictException("Stripe didn't return a connected account id");
            }
            partner.setStripeAccountId(accountId.toString());
            partnerRepository.save(partner);
        }

        // Fixed a real bug here: this used to be "/#/admin?tab=partners&connect=..." (a query-param
        // tab scheme this app doesn't use — admin sections are real paths, /#/admin/partners) so the
        // browser would've landed on a route that doesn't exist after Stripe's redirect back.
        String baseUrl = platformSettingsService.getEffectiveAppBaseUrl();
        String refreshUrl = baseUrl + returnBasePath + "?connect=refresh";
        String returnUrl = baseUrl + returnBasePath + "?connect=return";

        MultiValueMap<String, String> linkParams = new LinkedMultiValueMap<>();
        linkParams.add("account", partner.getStripeAccountId());
        linkParams.add("refresh_url", refreshUrl);
        linkParams.add("return_url", returnUrl);
        linkParams.add("type", "account_onboarding");

        Map<String, Object> link = stripeClient.createAccountLink(secretKey, linkParams);
        Object url = link.get("url");
        if (url == null) {
            throw new ConflictException("Stripe didn't return an onboarding link");
        }
        return new StripeConnectLinkResponse(url.toString());
    }

    /** Live status pulled straight from Stripe — see StripeConnectStatusResponse for why this isn't cached. */
    @Transactional(readOnly = true)
    public StripeConnectStatusResponse getStripeConnectStatus(UUID partnerId) {
        Partner partner = findPartner(partnerId);
        if (partner.getStripeAccountId() == null) {
            return StripeConnectStatusResponse.notConnected();
        }
        String secretKey = stripeSecretProvider.requireSecretKey();
        Map<String, Object> account = stripeClient.retrieveAccount(secretKey, partner.getStripeAccountId());
        return new StripeConnectStatusResponse(
                true,
                partner.getStripeAccountId(),
                Boolean.TRUE.equals(account.get("charges_enabled")),
                Boolean.TRUE.equals(account.get("payouts_enabled")),
                Boolean.TRUE.equals(account.get("details_submitted"))
        );
    }

    @Transactional(readOnly = true)
    public StripeConnectStatusResponse getMyStripeConnectStatus() {
        return getStripeConnectStatus(currentUserProvider.requirePartnerId());
    }

    /** Single data source for the console's Revenue tab — the admin-set % plus a live Connect status pull, in one round trip. */
    @Transactional(readOnly = true)
    public PartnerRevenueSummaryResponse getMyRevenueSummary() {
        UUID partnerId = currentUserProvider.requirePartnerId();
        Partner partner = findPartner(partnerId);
        return PartnerRevenueSummaryResponse.of(partner.getRevenueSharePercent(), getStripeConnectStatus(partnerId));
    }

    /** Partner console's Billing & Invoices tab — read-only, every company under the caller's own partner. */
    @Transactional(readOnly = true)
    public List<InvoiceResponse> listMyInvoices() {
        return invoiceService.listForPartner();
    }

    /** Partner console's Feedback & Support tab — a partner acts as first-line support for its own client companies' tickets (reply, note, claim/resolve — see the write methods below). */
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listMyTickets() {
        return supportTicketService.listTicketsForPartner();
    }

    @Transactional(readOnly = true)
    public List<TicketMessageResponse> listMyTicketMessages(UUID ticketId) {
        return ticketMessageService.listMessagesForPartner(ticketId);
    }

    @Transactional
    public TicketMessageResponse postMyTicketMessage(UUID ticketId, String message) {
        return ticketMessageService.postMessageForPartner(ticketId, new CreateTicketMessageRequest(message));
    }

    @Transactional
    public SupportTicketResponse updateMyTicketStatus(UUID ticketId, TicketStatus status) {
        return supportTicketService.updateStatusForPartner(ticketId, new UpdateTicketStatusRequest(status));
    }

    @Transactional
    public SupportTicketResponse updateMyTicketNote(UUID ticketId, String note) {
        return supportTicketService.updateNoteForPartner(ticketId, new UpdateTicketNoteRequest(note));
    }

    /** Partner console's Audit Log tab — every company under the caller's own partner. */
    @Transactional(readOnly = true)
    public List<ActivityLogResponse> listMyActivityLog(Integer limit) {
        return activityLogService.listRecentForCompanies(myCompanyIds(), limit);
    }

    @Transactional(readOnly = true)
    public ActivityLogResponse getMyActivityLogEntry(UUID id) {
        return activityLogService.getByIdForCompanies(myCompanyIds(), id);
    }

    @Transactional(readOnly = true)
    public PartnerSecuritySettingsResponse getMySecuritySettings() {
        Partner partner = findPartner(currentUserProvider.requirePartnerId());
        return new PartnerSecuritySettingsResponse(Boolean.TRUE.equals(partner.getMfaRequiredForTeam()));
    }

    @Transactional
    public PartnerSecuritySettingsResponse updateMySecuritySettings(UpdatePartnerSecuritySettingsRequest request) {
        Partner partner = findPartner(currentUserProvider.requirePartnerId());
        partner.setMfaRequiredForTeam(request.mfaRequiredForTeam());
        partnerRepository.save(partner);
        return new PartnerSecuritySettingsResponse(Boolean.TRUE.equals(partner.getMfaRequiredForTeam()));
    }

    private List<UUID> myCompanyIds() {
        UUID partnerId = currentUserProvider.requirePartnerId();
        return companyRepository.findByPartnerIdOrderByNameAsc(partnerId).stream().map(Company::getId).toList();
    }

    private String generateTemporaryPassword() {
        byte[] bytes = new byte[18];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private void applyRequest(Partner partner, SavePartnerRequest request) {
        partner.setName(request.name());
        partner.setBrandName(request.brandName());
        partner.setLogoAsset(blankToNull(request.logoAsset()));
        partner.setPrimaryColor(blankToNull(request.primaryColor()));
        partner.setSupportEmail(blankToNull(request.supportEmail()));
        partner.setEmailFromAddress(blankToNull(request.emailFromAddress()));
        partner.setSubdomainSlug(blankToNull(request.subdomainSlug()));
        partner.setBillingModel(blankToNull(request.billingModel()));
        partner.setRevenueSharePercent(request.revenueSharePercent());
    }

    private Partner save(Partner partner) {
        try {
            return partnerRepository.save(partner);
        } catch (DataIntegrityViolationException e) {
            throw new ConflictException("That subdomain slug is already used by another partner");
        }
    }

    private Partner findPartner(UUID id) {
        return partnerRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Partner not found"));
    }

    private String blankToNull(String value) {
        return value != null && !value.isBlank() ? value : null;
    }
}
