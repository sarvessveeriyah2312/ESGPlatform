package com.esgeasy.esg.climate.dto;

import com.esgeasy.esg.climate.IfrsS1Disclosure;
import com.esgeasy.esg.climate.IntegrationLevel;
import com.esgeasy.esg.climate.ReviewFrequency;

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
