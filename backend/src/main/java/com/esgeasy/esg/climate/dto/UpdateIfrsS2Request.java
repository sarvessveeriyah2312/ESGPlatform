package com.esgeasy.esg.climate.dto;

import com.esgeasy.esg.climate.Currency;
import com.esgeasy.esg.climate.IntegrationLevel;
import com.esgeasy.esg.climate.ReviewFrequency;

import java.math.BigDecimal;

public record UpdateIfrsS2Request(
        String oversightDescription,
        ReviewFrequency reviewFrequency,
        String responsibleCommittee,
        String physicalRisks,
        String transitionPlan,
        String climateResilience,
        String identificationProcess,
        IntegrationLevel integrationLevel,
        String trackedMetrics,
        String reductionTargets,
        String carbonPricing,
        BigDecimal transitionRiskAssetPct,
        BigDecimal physicalRiskAssetPct,
        BigDecimal climateOpportunityAssetPct,
        BigDecimal climateCapex,
        Currency climateCapexCurrency,
        Boolean executiveRemunerationLinked,
        String executiveRemunerationDescription,
        BigDecimal carbonPriceValue,
        Currency carbonPriceCurrency,
        String linkedTargetId
) {
}
