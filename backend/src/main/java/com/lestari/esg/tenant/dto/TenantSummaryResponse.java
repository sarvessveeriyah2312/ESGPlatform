package com.lestari.esg.tenant.dto;

import com.lestari.esg.tenant.MarketClassification;
import com.lestari.esg.tenant.SubscriptionPlan;

import java.time.Instant;
import java.util.UUID;

public record TenantSummaryResponse(
        UUID id,
        String name,
        String sectorCode,
        MarketClassification marketClassification,
        SubscriptionPlan subscriptionPlan,
        boolean active,
        Instant createdAt,
        String primaryContactName,
        String primaryContactEmail
) {
}
