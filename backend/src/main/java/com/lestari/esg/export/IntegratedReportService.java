package com.lestari.esg.export;

import com.lestari.esg.common.exceptions.NotFoundException;
import com.lestari.esg.export.dto.LogExportRequest;
import com.lestari.esg.governance.CompliancePolicyService;
import com.lestari.esg.governance.GovernanceService;
import com.lestari.esg.governance.dto.CompliancePolicyResponse;
import com.lestari.esg.governance.dto.GovernanceLevelResponse;
import com.lestari.esg.governance.dto.MatterOwnershipResponse;
import com.lestari.esg.indicators.IndicatorService;
import com.lestari.esg.indicators.dto.IndicatorResponse;
import com.lestari.esg.indicators.dto.IndicatorValuePointDto;
import com.lestari.esg.materiality.AssessmentStatus;
import com.lestari.esg.materiality.MaterialityService;
import com.lestari.esg.materiality.dto.AssessmentSummaryResponse;
import com.lestari.esg.materiality.dto.ScoreResponse;
import com.lestari.esg.pdf.PdfRenderer;
import com.lestari.esg.security.CurrentUserProvider;
import com.lestari.esg.tenant.Company;
import com.lestari.esg.tenant.CompanyRepository;
import com.lestari.esg.tenant.SubscriptionPlan;
import com.lestari.esg.user.AppUser;
import com.lestari.esg.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Renders the cross-module Integrated ESG Disclosure Report as a professional PDF via the {@code integrated-esg-report} Thymeleaf template. */
@Service
public class IntegratedReportService {

    private final CompanyRepository companyRepository;
    private final CurrentUserProvider currentUserProvider;
    private final AppUserRepository appUserRepository;
    private final MaterialityService materialityService;
    private final GovernanceService governanceService;
    private final CompliancePolicyService compliancePolicyService;
    private final IndicatorService indicatorService;
    private final ExportService exportService;
    private final PdfRenderer pdfRenderer;

    public IntegratedReportService(CompanyRepository companyRepository,
                                    CurrentUserProvider currentUserProvider,
                                    AppUserRepository appUserRepository,
                                    MaterialityService materialityService,
                                    GovernanceService governanceService,
                                    CompliancePolicyService compliancePolicyService,
                                    IndicatorService indicatorService,
                                    ExportService exportService,
                                    PdfRenderer pdfRenderer) {
        this.companyRepository = companyRepository;
        this.currentUserProvider = currentUserProvider;
        this.appUserRepository = appUserRepository;
        this.materialityService = materialityService;
        this.governanceService = governanceService;
        this.compliancePolicyService = compliancePolicyService;
        this.indicatorService = indicatorService;
        this.exportService = exportService;
        this.pdfRenderer = pdfRenderer;
    }

    public record GeneratedReport(byte[] content, String filename) {
    }

    @Transactional
    public GeneratedReport generateReport(int fiscalYear) {
        UUID companyId = currentUserProvider.requireCompanyId();
        Company company = companyRepository.findById(companyId).orElseThrow(() -> new NotFoundException("Company not found"));
        AppUser reviewer = appUserRepository.findById(currentUserProvider.getPrincipal().userId()).orElse(null);

        List<AssessmentSummaryResponse> assessments = materialityService.listAssessments();
        AssessmentSummaryResponse latestAssessment = assessments.stream()
                .filter(a -> a.status() == AssessmentStatus.VALIDATED)
                .findFirst()
                .orElse(assessments.isEmpty() ? null : assessments.get(0));
        List<ScoreResponse> materialityScores = latestAssessment != null
                ? materialityService.getAssessment(latestAssessment.id()).scores().stream()
                        .sorted(Comparator.comparingInt((ScoreResponse s) -> s.impact() + s.influence()).reversed())
                        .toList()
                : List.of();

        List<GovernanceLevelResponse> structure = governanceService.getStructure().stream()
                .sorted(Comparator.comparingInt(l -> l.level().ordinal()))
                .toList();
        List<MatterOwnershipResponse> ownership = governanceService.getOwnership();
        List<CompliancePolicyResponse> policies = compliancePolicyService.getPolicies();
        boolean governanceUnlocked = company.getSubscriptionPlan().atLeast(SubscriptionPlan.GROWTH);

        List<IndicatorResponse> indicators = indicatorService.listIndicators();
        java.util.Map<String, java.math.BigDecimal> indicatorValueById = new java.util.HashMap<>();
        for (IndicatorResponse ind : indicators) {
            java.math.BigDecimal value = valueForYear(ind, fiscalYear);
            if (value != null) {
                indicatorValueById.put(ind.id(), value);
            }
        }

        int materialityPercentage = latestAssessment != null && latestAssessment.status() == AssessmentStatus.VALIDATED
                ? 100 : !assessments.isEmpty() ? 50 : 0;
        int governancePercentage = !governanceUnlocked ? 0 : structure.size() >= 3 ? 100 : structure.isEmpty() ? 0 : 50;
        long filledIndicators = indicators.stream().filter(ind -> valueForYear(ind, fiscalYear) != null).count();
        int indicatorsPercentage = indicators.isEmpty() ? 0 : (int) Math.round(filledIndicators * 100.0 / indicators.size());

        Instant generatedAt = Instant.now();
        String checksum = computeChecksum(buildSummaryText(company, fiscalYear, materialityScores, structure, ownership, policies, indicators));

        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariable("company", company);
        ctx.setVariable("fiscalYear", fiscalYear);
        ctx.setVariable("reviewerName", reviewer != null ? reviewer.getName() : "Unknown");
        ctx.setVariable("generatedAt", generatedAt);
        ctx.setVariable("checksum", checksum);
        ctx.setVariable("materialityPercentage", materialityPercentage);
        ctx.setVariable("governancePercentage", governancePercentage);
        ctx.setVariable("indicatorsPercentage", indicatorsPercentage);
        ctx.setVariable("latestAssessment", latestAssessment);
        ctx.setVariable("materialityScores", materialityScores);
        ctx.setVariable("governanceUnlocked", governanceUnlocked);
        ctx.setVariable("structure", structure);
        ctx.setVariable("ownership", ownership);
        ctx.setVariable("policies", policies);
        ctx.setVariable("indicators", indicators);
        ctx.setVariable("filledIndicators", filledIndicators);
        ctx.setVariable("indicatorValueById", indicatorValueById);

        byte[] pdf = pdfRenderer.render("integrated-esg-report", ctx);

        exportService.logClientGeneratedExport(new LogExportRequest("Integrated ESG Report", ExportFormat.PDF, fiscalYear));

        String filename = "Lestari_ESG_Integrated_Report_FY" + fiscalYear + ".pdf";
        return new GeneratedReport(pdf, filename);
    }

    private java.math.BigDecimal valueForYear(IndicatorResponse indicator, int fiscalYear) {
        return indicator.values().stream()
                .filter(v -> v.fiscalYear() == fiscalYear)
                .map(IndicatorValuePointDto::value)
                .findFirst()
                .orElse(null);
    }

    private String buildSummaryText(Company company, int fiscalYear, List<ScoreResponse> materialityScores,
                                     List<GovernanceLevelResponse> structure, List<MatterOwnershipResponse> ownership,
                                     List<CompliancePolicyResponse> policies, List<IndicatorResponse> indicators) {
        List<String> lines = new ArrayList<>();
        lines.add("Entity: " + company.getName());
        lines.add("Sector: " + (company.getSector() != null ? company.getSector().getName() : "Not set")
                + " | Market: " + company.getMarketClassification());
        lines.add("Period: FY" + fiscalYear);
        if (materialityScores.isEmpty()) {
            lines.add("No materiality assessment completed yet.");
        } else {
            materialityScores.forEach(s -> lines.add("- " + s.matterName() + " (Priority: " + s.priorityTier() + ")"));
        }
        if (structure.isEmpty()) {
            lines.add("No governance structure configured yet.");
        } else {
            structure.forEach(l -> lines.add(l.level().name() + ": " + l.roleTitle()));
            lines.add(ownership.size() + " sustainability matter(s) have assigned ownership.");
            policies.forEach(p -> lines.add(p.name() + ": " + p.status()));
        }
        indicators.forEach(ind -> {
            java.math.BigDecimal value = valueForYear(ind, fiscalYear);
            lines.add(ind.name() + ": " + (value != null ? value.toPlainString() : "N/A") + " " + (ind.unit() != null ? ind.unit() : ""));
        });
        return String.join("\n", lines);
    }

    private String computeChecksum(String content) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(content.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.substring(0, 12).toUpperCase(Locale.ROOT);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
