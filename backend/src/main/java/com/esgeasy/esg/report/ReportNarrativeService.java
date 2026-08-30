package com.esgeasy.esg.report;

import com.esgeasy.esg.report.dto.ReportNarrativeResponse;
import com.esgeasy.esg.report.dto.UpdateReportNarrativeRequest;
import com.esgeasy.esg.security.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class ReportNarrativeService {

    private final ReportNarrativeRepository repository;
    private final CurrentUserProvider currentUserProvider;

    public ReportNarrativeService(ReportNarrativeRepository repository, CurrentUserProvider currentUserProvider) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public ReportNarrativeResponse get() {
        UUID companyId = currentUserProvider.requireCompanyId();
        return repository.findByCompanyId(companyId)
                .map(ReportNarrativeResponse::from)
                .orElseGet(ReportNarrativeResponse::empty);
    }

    @Transactional
    public ReportNarrativeResponse update(UpdateReportNarrativeRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        ReportNarrative narrative = repository.findByCompanyId(companyId).orElseGet(() -> {
            ReportNarrative n = new ReportNarrative();
            n.setCompanyId(companyId);
            return n;
        });

        narrative.setCeoStatement(request.ceoStatement());
        narrative.setReportScopeDescription(request.reportScopeDescription());
        narrative.setCompanyOverview(request.companyOverview());
        narrative.setEsgStrategyNarrative(request.esgStrategyNarrative());
        narrative.setSustainabilityEmail(request.sustainabilityEmail());
        narrative.setInvestorRelationsEmail(request.investorRelationsEmail());
        narrative = repository.save(narrative);

        return ReportNarrativeResponse.from(narrative);
    }
}
