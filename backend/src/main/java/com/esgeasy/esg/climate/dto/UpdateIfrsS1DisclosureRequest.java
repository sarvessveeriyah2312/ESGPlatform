package com.lestari.esg.climate.dto;

import com.lestari.esg.climate.IntegrationLevel;
import com.lestari.esg.climate.ReviewFrequency;

public record UpdateIfrsS1DisclosureRequest(
        String oversightDescription,
        ReviewFrequency reviewFrequency,
        String responsibleCommittee,
        String identificationProcess,
        IntegrationLevel integrationLevel,
        String trackedMetrics,
        String targetsSummary,
        String connectedInformation
) {
}
