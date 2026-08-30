package com.esgeasy.esg.report.dto;

import com.esgeasy.esg.report.ReportNarrative;

public record ReportNarrativeResponse(
        String ceoStatement,
        String reportScopeDescription,
        String companyOverview,
        String esgStrategyNarrative,
        String sustainabilityEmail,
        String investorRelationsEmail
) {
    public static ReportNarrativeResponse from(ReportNarrative n) {
        return new ReportNarrativeResponse(
                n.getCeoStatement(), n.getReportScopeDescription(), n.getCompanyOverview(),
                n.getEsgStrategyNarrative(), n.getSustainabilityEmail(), n.getInvestorRelationsEmail()
        );
    }

    public static ReportNarrativeResponse empty() {
        return new ReportNarrativeResponse(null, null, null, null, null, null);
    }
}
