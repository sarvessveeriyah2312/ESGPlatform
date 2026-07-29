package com.esgeasy.esg.climate.dto;

import com.esgeasy.esg.climate.IntegrationLevel;
import com.esgeasy.esg.climate.ReviewFrequency;

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
