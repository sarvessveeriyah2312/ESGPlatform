package com.esgeasy.esg.climate.dto;

import com.esgeasy.esg.climate.Currency;
import com.esgeasy.esg.climate.ImpactSeverity;
import com.esgeasy.esg.climate.RiskLikelihood;
import com.esgeasy.esg.climate.RiskOpportunityType;
import com.esgeasy.esg.climate.S1RiskOpportunity;
import com.esgeasy.esg.climate.TimeHorizon;

import java.math.BigDecimal;
import java.util.UUID;

public record S1ItemResponse(
        UUID id,
        String title,
        RiskOpportunityType type,
        String description,
        TimeHorizon horizon,
        BigDecimal financialImpact,
        Currency currency,
        String category,
        RiskLikelihood likelihood,
        ImpactSeverity impactSeverity,
        String mitigationApproach
) {
    public static S1ItemResponse from(S1RiskOpportunity r) {
        return new S1ItemResponse(r.getId(), r.getTitle(), r.getType(), r.getDescription(), r.getHorizon(), r.getFinancialImpact(), r.getCurrency(),
                r.getCategory(), r.getLikelihood(), r.getImpactSeverity(), r.getMitigationApproach());
    }
}
