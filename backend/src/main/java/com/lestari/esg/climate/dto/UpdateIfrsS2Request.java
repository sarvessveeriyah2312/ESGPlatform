package com.lestari.esg.climate.dto;

import com.lestari.esg.climate.IntegrationLevel;
import com.lestari.esg.climate.ReviewFrequency;

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
        String linkedTargetId
) {
}
