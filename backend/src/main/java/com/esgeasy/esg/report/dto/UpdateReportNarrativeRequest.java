package com.esgeasy.esg.report.dto;

import jakarta.validation.constraints.Email;

public record UpdateReportNarrativeRequest(
        String ceoStatement,
        String reportScopeDescription,
        String companyOverview,
        String esgStrategyNarrative,
        @Email String sustainabilityEmail,
        @Email String investorRelationsEmail
) {
}
