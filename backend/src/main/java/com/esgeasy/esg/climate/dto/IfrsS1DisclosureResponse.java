package com.lestari.esg.climate.dto;

import com.lestari.esg.climate.IfrsS1Disclosure;
import com.lestari.esg.climate.IntegrationLevel;
import com.lestari.esg.climate.ReviewFrequency;

public record IfrsS1DisclosureResponse(
        String oversightDescription,
        ReviewFrequency reviewFrequency,
        String responsibleCommittee,
        String identificationProcess,
        IntegrationLevel integrationLevel,
        String trackedMetrics,
        String targetsSummary,
        String connectedInformation
) {
    public static IfrsS1DisclosureResponse from(IfrsS1Disclosure d) {
        return new IfrsS1DisclosureResponse(
                d.getOversightDescription(), d.getReviewFrequency(), d.getResponsibleCommittee(),
                d.getIdentificationProcess(), d.getIntegrationLevel(),
                d.getTrackedMetrics(), d.getTargetsSummary(), d.getConnectedInformation()
        );
    }
}
