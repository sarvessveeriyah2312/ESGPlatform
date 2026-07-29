package com.lestari.esg.climate.dto;

import com.lestari.esg.climate.Currency;
import com.lestari.esg.climate.IfrsS2Disclosure;
import com.lestari.esg.climate.IntegrationLevel;
import com.lestari.esg.climate.ReviewFrequency;

import java.math.BigDecimal;

public record IfrsS2Response(
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
    public static IfrsS2Response from(IfrsS2Disclosure d) {
        return new IfrsS2Response(
                d.getOversightDescription(), d.getReviewFrequency(), d.getResponsibleCommittee(),
                d.getPhysicalRisks(), d.getTransitionPlan(), d.getClimateResilience(),
                d.getIdentificationProcess(), d.getIntegrationLevel(),
                d.getTrackedMetrics(), d.getReductionTargets(), d.getCarbonPricing(),
                d.getTransitionRiskAssetPct(), d.getPhysicalRiskAssetPct(), d.getClimateOpportunityAssetPct(),
                d.getClimateCapex(), d.getClimateCapexCurrency(),
                d.getExecutiveRemunerationLinked(), d.getExecutiveRemunerationDescription(),
                d.getCarbonPriceValue(), d.getCarbonPriceCurrency(),
                d.getLinkedTarget() != null ? d.getLinkedTarget().getId().toString() : null
        );
    }
}
