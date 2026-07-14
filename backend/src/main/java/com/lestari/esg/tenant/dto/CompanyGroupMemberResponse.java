package com.lestari.esg.tenant.dto;

import com.lestari.esg.tenant.Company;
import com.lestari.esg.tenant.MarketClassification;
import com.lestari.esg.tenant.SubscriptionPlan;

import java.util.UUID;

public record CompanyGroupMemberResponse(
        UUID id,
        String name,
        String sectorCode,
        MarketClassification marketClassification,
        SubscriptionPlan subscriptionPlan,
        boolean current
) {
    public static CompanyGroupMemberResponse from(Company c, boolean current) {
        return new CompanyGroupMemberResponse(
                c.getId(), c.getName(), c.getSector() != null ? c.getSector().getCode() : null,
                c.getMarketClassification(), c.getSubscriptionPlan(), current
        );
    }
}
