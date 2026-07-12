package com.lestari.esg.climate.dto;

import com.lestari.esg.climate.Currency;
import com.lestari.esg.climate.RiskOpportunityType;
import com.lestari.esg.climate.S1RiskOpportunity;
import com.lestari.esg.climate.TimeHorizon;

import java.math.BigDecimal;
import java.util.UUID;

public record S1ItemResponse(
        UUID id,
        String title,
        RiskOpportunityType type,
        String description,
        TimeHorizon horizon,
        BigDecimal financialImpact,
        Currency currency
) {
    public static S1ItemResponse from(S1RiskOpportunity r) {
        return new S1ItemResponse(r.getId(), r.getTitle(), r.getType(), r.getDescription(), r.getHorizon(), r.getFinancialImpact(), r.getCurrency());
    }
}
