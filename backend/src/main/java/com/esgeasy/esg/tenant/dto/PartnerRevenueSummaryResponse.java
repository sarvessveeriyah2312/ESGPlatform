package com.esgeasy.esg.tenant.dto;

import java.math.BigDecimal;

/** A partner's own revenue-share view (WHITELABEL_PLAN.md Phase 5) — the % is platform-admin-set and shown here read-only; Connect status is live from Stripe. See PartnerService.getMyRevenueSummary. */
public record PartnerRevenueSummaryResponse(
        BigDecimal revenueSharePercent,
        boolean connected,
        boolean chargesEnabled,
        boolean payoutsEnabled,
        boolean detailsSubmitted
) {
    public static PartnerRevenueSummaryResponse of(BigDecimal revenueSharePercent, StripeConnectStatusResponse status) {
        return new PartnerRevenueSummaryResponse(revenueSharePercent, status.connected(),
                status.chargesEnabled(), status.payoutsEnabled(), status.detailsSubmitted());
    }
}
