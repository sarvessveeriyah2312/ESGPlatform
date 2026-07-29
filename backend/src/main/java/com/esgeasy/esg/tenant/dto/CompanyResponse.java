package com.lestari.esg.tenant.dto;

import com.lestari.esg.tenant.Company;
import com.lestari.esg.tenant.CompanySizeBand;
import com.lestari.esg.tenant.MarketClassification;
import com.lestari.esg.tenant.SubscriptionPlan;

import java.util.UUID;

public record CompanyResponse(
        UUID id,
        String name,
        String sectorCode,
        CompanySizeBand sizeBand,
        MarketClassification marketClassification,
        SubscriptionPlan subscriptionPlan,
        boolean sectorModuleEnabled,
        boolean onboardingCompleted
) {
    public static CompanyResponse from(Company c) {
        return new CompanyResponse(
                c.getId(), c.getName(), c.getSector() != null ? c.getSector().getCode() : null,
                c.getSizeBand(), c.getMarketClassification(), c.getSubscriptionPlan(),
                Boolean.TRUE.equals(c.getSectorModuleEnabled()), Boolean.TRUE.equals(c.getOnboardingCompleted())
        );
    }
}
