package com.esgeasy.esg.governance;

import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.export.ExportFormat;
import com.esgeasy.esg.export.ExportService;
import com.esgeasy.esg.export.dto.LogExportRequest;
import com.esgeasy.esg.governance.dto.CompliancePolicyResponse;
import com.esgeasy.esg.governance.dto.GovernanceLevelResponse;
import com.esgeasy.esg.governance.dto.MatterOwnershipResponse;
import com.esgeasy.esg.pdf.PdfRenderer;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.time.Instant;
import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/** Renders the Governance & Compliance structure as a professional PDF via the {@code governance-report} Thymeleaf template. */
@Service
public class GovernanceReportService {

    private final GovernanceService governanceService;
    private final CompliancePolicyService compliancePolicyService;
    private final CompanyRepository companyRepository;
    private final CurrentUserProvider currentUserProvider;
    private final ExportService exportService;
    private final PdfRenderer pdfRenderer;

    public GovernanceReportService(GovernanceService governanceService,
                                    CompliancePolicyService compliancePolicyService,
                                    CompanyRepository companyRepository,
                                    CurrentUserProvider currentUserProvider,
                                    ExportService exportService,
                                    PdfRenderer pdfRenderer) {
        this.governanceService = governanceService;
        this.compliancePolicyService = compliancePolicyService;
        this.companyRepository = companyRepository;
        this.currentUserProvider = currentUserProvider;
        this.exportService = exportService;
        this.pdfRenderer = pdfRenderer;
    }

    public record GeneratedReport(byte[] content, String filename) {
    }

    @Transactional
    public GeneratedReport generateReport() {
        Company company = companyRepository.findById(currentUserProvider.requireCompanyId())
                .orElseThrow(() -> new NotFoundException("Company not found"));

        List<GovernanceLevelResponse> structure = governanceService.getStructure().stream()
                .sorted(Comparator.comparingInt(l -> l.level().ordinal()))
                .toList();
        List<MatterOwnershipResponse> ownership = governanceService.getOwnership();
        List<CompliancePolicyResponse> policies = compliancePolicyService.getPolicies();

        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariable("company", company);
        ctx.setVariable("structure", structure);
        ctx.setVariable("ownership", ownership);
        ctx.setVariable("policies", policies);
        ctx.setVariable("generatedAt", Instant.now());

        byte[] pdf = pdfRenderer.render("governance-report", ctx);

        exportService.logClientGeneratedExport(new LogExportRequest(
                "Governance & Compliance Report", ExportFormat.PDF, Year.now().getValue()));

        String safeName = company.getName().replaceAll("[^a-zA-Z0-9]+", "_");
        String filename = "EsgEasy_Governance_Report_" + safeName + ".pdf";
        return new GeneratedReport(pdf, filename);
    }
}
