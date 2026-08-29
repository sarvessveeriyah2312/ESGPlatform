package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.MarketClassification;
import com.esgeasy.esg.tenant.SubscriptionPlan;

import java.time.Instant;
import java.util.UUID;

/**
 * Deliberately minimal — the partner console (WHITELABEL_PLAN.md Phase 4) is read-only visibility
 * only. What a partner should be allowed to see/do beyond this (billing? inviting users into their
 * companies? changing plans?) is explicitly flagged as undecided in WHITELABEL_PLAN.md's open
 * decisions, so this intentionally does NOT reuse the fuller TenantSummaryResponse a platform admin
 * sees (contact details, trial state, etc.) until that's actually designed.
 */
public record PartnerCompanySummaryResponse(
        UUID id,
        String name,
        MarketClassification marketClassification,
        SubscriptionPlan subscriptionPlan,
        boolean active,
        Instant createdAt
) {
    public static PartnerCompanySummaryResponse from(Company c) {
        return new PartnerCompanySummaryResponse(c.getId(), c.getName(), c.getMarketClassification(),
                c.getSubscriptionPlan(), Boolean.TRUE.equals(c.getActive()), c.getCreatedAt());
    }
}
