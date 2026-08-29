package com.esgeasy.esg.tenant;

import com.esgeasy.esg.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * A white-label partner (consultancy, bank, accounting firm) that can offer EsgEasy under its own
 * brand to its own end customers. Independent of {@link SubscriptionPlan} — a company linked to a
 * partner (via {@link Company#getPartner()}) still has its own plan tier underneath; the partner
 * only determines branding/attribution, not feature access. See ONPREM_PLAN.md's sibling doc,
 * WHITELABEL_PLAN.md, Phase 1. Admin-only CRUD (PartnerController) — no self-service yet, and
 * brand resolution (MeResponse, frontend theming) is a later phase, not wired up here.
 */
@Entity
@Table(name = "partner")
@Getter
@Setter
@NoArgsConstructor
public class Partner extends BaseEntity {

    /** Internal name — what your team calls this partner, not necessarily customer-facing. */
    @Column(nullable = false, length = 200)
    private String name;

    /** Customer-facing brand name shown to the partner's own end customers. */
    @Column(name = "brand_name", nullable = false, length = 200)
    private String brandName;

    @Column(name = "logo_asset", length = 500)
    private String logoAsset;

    @Column(name = "primary_color", length = 20)
    private String primaryColor;

    @Column(name = "support_email")
    private String supportEmail;

    @Column(name = "email_from_address")
    private String emailFromAddress;

    /** Reserved for future subdomain-based brand routing (WHITELABEL_PLAN.md Phase 3) — not resolved anywhere yet. */
    @Column(name = "subdomain_slug", length = 100, unique = true)
    private String subdomainSlug;

    /** Free-text description for display (e.g. "15% revenue share") — see revenueSharePercent below for the actual number CompanyBillingService computes destination charges from. */
    @Column(name = "billing_model", length = 50)
    private String billingModel;

    // --- Stripe Connect / revenue share (WHITELABEL_PLAN.md Phase 5) ---

    /** Null until a platform admin starts Connect onboarding for this partner — see PartnerService.startStripeConnectOnboarding. */
    @Column(name = "stripe_account_id", length = 255)
    private String stripeAccountId;

    /**
     * The actual percentage CompanyBillingService.createCheckoutSession routes to this partner's
     * connected account via a destination charge, e.g. 15.00 for 15%. Deliberately separate from
     * the free-text billingModel above — that field is display-only, this is what code computes
     * from. Null means no revenue share is applied even if a Stripe account is connected (a
     * platform admin must set an explicit number; there is no default percentage).
     */
    @Column(name = "revenue_share_percent", precision = 5, scale = 2)
    private BigDecimal revenueSharePercent;

    /**
     * Partner-console "Security" setting — separate from {@code PlatformSettings.require2fa}
     * (platform-wide, applies to every role, platform-admin-only). A partner-admin can require
     * MFA for just their own team without needing a platform admin to flip the global toggle.
     * Checked alongside the platform toggle in AuthService.requiresMfa.
     */
    @Column(name = "mfa_required_for_team", nullable = false)
    private Boolean mfaRequiredForTeam = false;
}
