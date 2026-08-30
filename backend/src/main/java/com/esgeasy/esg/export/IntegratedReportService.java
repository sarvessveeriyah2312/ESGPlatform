package com.esgeasy.esg.export;

import com.esgeasy.esg.climate.EmissionsService;
import com.esgeasy.esg.climate.IfrsService;
import com.esgeasy.esg.climate.dto.BusinessSegmentResponse;
import com.esgeasy.esg.climate.dto.EmissionsResponse;
import com.esgeasy.esg.assurance.AssuranceService;
import com.esgeasy.esg.assurance.dto.SignOffResponse;
import com.esgeasy.esg.climate.dto.IfrsS1DisclosureResponse;
import com.esgeasy.esg.climate.dto.IfrsS2Response;
import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.export.dto.LogExportRequest;
import com.esgeasy.esg.forecasting.ForecastingService;
import com.esgeasy.esg.forecasting.dto.ForecastSummaryResponse;
import com.esgeasy.esg.governance.CompliancePolicyService;
import com.esgeasy.esg.governance.GovernanceService;
import com.esgeasy.esg.governance.dto.CompliancePolicyResponse;
import com.esgeasy.esg.governance.dto.GovernanceLevelResponse;
import com.esgeasy.esg.governance.dto.MatterOwnershipResponse;
import com.esgeasy.esg.indicators.IndicatorService;
import com.esgeasy.esg.indicators.dto.IndicatorResponse;
import com.esgeasy.esg.indicators.dto.IndicatorValuePointDto;
import com.esgeasy.esg.materiality.AssessmentStatus;
import com.esgeasy.esg.materiality.MaterialityService;
import com.esgeasy.esg.materiality.dto.AssessmentSummaryResponse;
import com.esgeasy.esg.materiality.dto.ScoreResponse;
import com.esgeasy.esg.pdf.PdfRenderer;
import com.esgeasy.esg.reference.SustainabilityMatterCategory;
import com.esgeasy.esg.report.ReportNarrativeService;
import com.esgeasy.esg.report.dto.ReportNarrativeResponse;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.targets.PerformanceTargetService;
import com.esgeasy.esg.targets.dto.PerformanceTargetResponse;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.CompanyRepository;
import com.esgeasy.esg.tenant.SubscriptionPlan;
import com.esgeasy.esg.user.AppUser;
import com.esgeasy.esg.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.context.Context;

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
    private final IfrsService ifrsService;
    private final EmissionsService emissionsService;
    private final AssuranceService assuranceService;
    private final ForecastingService forecastingService;
    private final ReportNarrativeService reportNarrativeService;
    private final PerformanceTargetService performanceTargetService;
    private final ExportService exportService;
    private final PdfRenderer pdfRenderer;

    public IntegratedReportService(CompanyRepository companyRepository,
                                    CurrentUserProvider currentUserProvider,
                                    AppUserRepository appUserRepository,
                                    MaterialityService materialityService,
                                    GovernanceService governanceService,
                                    CompliancePolicyService compliancePolicyService,
                                    IndicatorService indicatorService,
                                    IfrsService ifrsService,
                                    EmissionsService emissionsService,
                                    AssuranceService assuranceService,
                                    ForecastingService forecastingService,
                                    ReportNarrativeService reportNarrativeService,
                                    PerformanceTargetService performanceTargetService,
                                    ExportService exportService,
                                    PdfRenderer pdfRenderer) {
        this.companyRepository = companyRepository;
        this.currentUserProvider = currentUserProvider;
        this.appUserRepository = appUserRepository;
        this.materialityService = materialityService;
        this.governanceService = governanceService;
        this.compliancePolicyService = compliancePolicyService;
        this.indicatorService = indicatorService;
        this.ifrsService = ifrsService;
        this.emissionsService = emissionsService;
        this.assuranceService = assuranceService;
        this.forecastingService = forecastingService;
        this.reportNarrativeService = reportNarrativeService;
        this.performanceTargetService = performanceTargetService;
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

        boolean climateUnlocked = company.getSubscriptionPlan().atLeast(SubscriptionPlan.ISSUER_READY);
        List<BusinessSegmentResponse> segments = climateUnlocked ? ifrsService.listSegments() : List.of();
        IfrsS1DisclosureResponse s1 = climateUnlocked ? ifrsService.getS1Disclosure() : null;
        IfrsS2Response s2 = climateUnlocked ? ifrsService.getS2() : null;
        EmissionsResponse emissions = climateUnlocked ? emissionsService.getEmissions() : null;
        java.math.BigDecimal scope1Value = ReportSupport.valueForYear(emissions != null ? emissions.scope1() : List.of(), fiscalYear);
        java.math.BigDecimal scope2Value = ReportSupport.valueForYear(emissions != null ? emissions.scope2() : List.of(), fiscalYear);
        java.math.BigDecimal scope3Total = ReportSupport.scope3TotalForYear(emissions, fiscalYear);
        int climatePercentage = climatePercentage(climateUnlocked, segments, s2, scope1Value, scope2Value, scope3Total);
        boolean hasRiskItems = segments.stream().anyMatch(s -> !s.items().isEmpty());

        SignOffResponse signOff = assuranceService.list().stream()
                .filter(r -> r.fiscalYear() == fiscalYear)
                .findFirst()
                .orElse(null);

        List<ForecastSummaryResponse> forecasts = forecastingService.list();

        ReportNarrativeResponse narrative = reportNarrativeService.get();
        List<PerformanceTargetResponse> targets = performanceTargetService.list();
        List<IndicatorResponse> environmentalIndicators = indicators.stream()
                .filter(ind -> ind.category() == SustainabilityMatterCategory.ENVIRONMENTAL)
                .toList();
        List<IndicatorResponse> socialIndicators = indicators.stream()
                .filter(ind -> ind.category() == SustainabilityMatterCategory.SOCIAL)
                .toList();
        List<Integer> recentYears = ReportSupport.recentYears(fiscalYear, 3);
        java.util.Map<String, java.util.Map<Integer, java.math.BigDecimal>> indicatorYearValues = ReportSupport.indicatorYearValues(indicators);
        java.util.Map<Integer, java.math.BigDecimal> scope1ByYear = new java.util.HashMap<>();
        java.util.Map<Integer, java.math.BigDecimal> scope2ByYear = new java.util.HashMap<>();
        java.util.Map<Integer, java.math.BigDecimal> scope3TotalByYear = new java.util.HashMap<>();
        for (Integer y : recentYears) {
            scope1ByYear.put(y, ReportSupport.valueForYear(emissions != null ? emissions.scope1() : List.of(), y));
            scope2ByYear.put(y, ReportSupport.valueForYear(emissions != null ? emissions.scope2() : List.of(), y));
            scope3TotalByYear.put(y, ReportSupport.scope3TotalForYear(emissions, y));
        }
        List<ReportSupport.GhgChartPoint> ghgChart = ReportSupport.buildGhgChart(recentYears, scope1ByYear, scope2ByYear, scope3TotalByYear, 90);
        boolean hasGhgChartData = ReportSupport.hasPositiveGhgValue(scope1ByYear, scope2ByYear, scope3TotalByYear);

        Instant generatedAt = Instant.now();
        String checksum = ReportSupport.computeChecksum(buildSummaryText(company, fiscalYear, materialityScores, structure, ownership, policies, indicators,
                climateUnlocked, segments, s2, scope1Value, scope2Value, scope3Total, forecasts, narrative, targets));

        Context ctx = new Context(Locale.ENGLISH);
        ctx.setVariable("company", company);
        ctx.setVariable("frameworkLabel", frameworkLabel(company));
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
        ctx.setVariable("climateUnlocked", climateUnlocked);
        ctx.setVariable("climatePercentage", climatePercentage);
        ctx.setVariable("segments", segments);
        ctx.setVariable("s1", s1);
        ctx.setVariable("s2", s2);
        ctx.setVariable("scope1Value", scope1Value);
        ctx.setVariable("scope2Value", scope2Value);
        ctx.setVariable("scope3Categories", emissions != null ? emissions.scope3() : List.of());
        ctx.setVariable("scope3Total", scope3Total);
        ctx.setVariable("scope3ValueByCategoryId", ReportSupport.scope3ValueByCategoryId(emissions, fiscalYear));
        ctx.setVariable("signOff", signOff);
        ctx.setVariable("forecasts", forecasts);
        ctx.setVariable("narrative", narrative);
        ctx.setVariable("targets", targets);
        ctx.setVariable("environmentalIndicators", environmentalIndicators);
        ctx.setVariable("socialIndicators", socialIndicators);
        ctx.setVariable("recentYears", recentYears);
        ctx.setVariable("indicatorYearValues", indicatorYearValues);
        ctx.setVariable("scope1ByYear", scope1ByYear);
        ctx.setVariable("scope2ByYear", scope2ByYear);
        ctx.setVariable("scope3TotalByYear", scope3TotalByYear);
        ctx.setVariable("hasRiskItems", hasRiskItems);
        ctx.setVariable("ghgChart", ghgChart);
        ctx.setVariable("hasGhgChartData", hasGhgChartData);

        byte[] pdf = pdfRenderer.render("integrated-esg-report", ctx);

        exportService.logClientGeneratedExport(new LogExportRequest("Integrated ESG Report", ExportFormat.PDF, fiscalYear));

        String filename = "EsgEasy_" + ReportSupport.filenameSlug(company.getName()) + "_ESG_Integrated_Report_FY" + fiscalYear + ".pdf";
        return new GeneratedReport(pdf, filename);
    }

    /** SEDG only applies to SME/Starter-tier issuers — Main and ACE Market issuers report against
     *  Bursa's own Common Sustainability Matters framework, not SEDG. This was previously
     *  hardcoded to "SEDG" for every company regardless of market classification. */
    private String frameworkLabel(Company company) {
        return switch (company.getMarketClassification()) {
            case SME -> "Simplified ESG Disclosure Guide (SEDG)";
            case MAIN_MARKET -> "Bursa Malaysia Main Market Sustainability Reporting Guide";
            case ACE_MARKET -> "Bursa Malaysia ACE Market Sustainability Reporting Guide";
        };
    }

    private java.math.BigDecimal valueForYear(IndicatorResponse indicator, int fiscalYear) {
        return indicator.values().stream()
                .filter(v -> v.fiscalYear() == fiscalYear)
                .map(IndicatorValuePointDto::value)
                .findFirst()
                .orElse(null);
    }

    private int climatePercentage(boolean climateUnlocked, List<BusinessSegmentResponse> segments, IfrsS2Response s2,
                                   java.math.BigDecimal scope1Value, java.math.BigDecimal scope2Value, java.math.BigDecimal scope3Total) {
        if (!climateUnlocked) {
            return 0;
        }
        boolean hasS1Items = segments.stream().anyMatch(s -> !s.items().isEmpty());
        boolean hasS2Narrative = s2 != null && s2.oversightDescription() != null && !s2.oversightDescription().isBlank();
        boolean hasEmissionsForYear = scope1Value != null || scope2Value != null
                || (scope3Total != null && scope3Total.signum() > 0);
        long filled = java.util.stream.Stream.of(hasS1Items, hasS2Narrative, hasEmissionsForYear).filter(b -> b).count();
        return (int) Math.round(filled * 100.0 / 3);
    }

    private String buildSummaryText(Company company, int fiscalYear, List<ScoreResponse> materialityScores,
                                     List<GovernanceLevelResponse> structure, List<MatterOwnershipResponse> ownership,
                                     List<CompliancePolicyResponse> policies, List<IndicatorResponse> indicators,
                                     boolean climateUnlocked, List<BusinessSegmentResponse> segments, IfrsS2Response s2,
                                     java.math.BigDecimal scope1Value, java.math.BigDecimal scope2Value, java.math.BigDecimal scope3Total,
                                     List<ForecastSummaryResponse> forecasts, ReportNarrativeResponse narrative,
                                     List<PerformanceTargetResponse> targets) {
        List<String> lines = new ArrayList<>();
        lines.add("Entity: " + company.getName());
        lines.add("CEO Statement: " + (narrative.ceoStatement() != null ? narrative.ceoStatement() : "Not yet provided"));
        lines.add("Company Overview: " + (narrative.companyOverview() != null ? narrative.companyOverview() : "Not yet provided"));
        targets.forEach(t -> lines.add("Target [" + t.title() + "]: baseline FY" + t.baselineYear() + " -> target " + t.targetValue().toPlainString()
                + " by FY" + t.targetYear() + " (" + t.currentProgress() + "% progress)"));
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
        if (!climateUnlocked) {
            lines.add("IFRS S1/S2 and GHG emissions disclosures not included (requires Issuer-Ready plan).");
        } else {
            segments.forEach(seg -> seg.items().forEach(item ->
                    lines.add("IFRS S1 [" + seg.name() + "]: " + item.title() + " (" + item.type() + ", " + item.horizon() + ")")));
            if (s2 != null) {
                lines.add("IFRS S2 Oversight: " + (s2.oversightDescription() != null ? s2.oversightDescription() : "Not disclosed"));
            }
            lines.add("Scope 1 GHG (FY" + fiscalYear + "): " + (scope1Value != null ? scope1Value.toPlainString() : "N/A") + " tCO2e");
            lines.add("Scope 2 GHG (FY" + fiscalYear + "): " + (scope2Value != null ? scope2Value.toPlainString() : "N/A") + " tCO2e");
            lines.add("Scope 3 GHG (FY" + fiscalYear + "): " + (scope3Total != null ? scope3Total.toPlainString() : "N/A") + " tCO2e");
        }
        if (forecasts.isEmpty()) {
            lines.add("No AI forecasts available yet (indicators need at least two fiscal years of recorded history).");
        } else {
            forecasts.forEach(f -> {
                String line = "Forecast [" + f.indicatorName() + "]: " + f.trendDirection() + " trend, projected "
                        + f.projectedValue().toPlainString() + " " + f.unit() + " by FY" + f.projectionYear();
                if (f.targetAlignment() != null) {
                    line += " (" + f.targetAlignment().status() + " vs. target " + f.targetAlignment().targetValue().toPlainString()
                            + " " + f.unit() + " for \"" + f.targetAlignment().targetTitle() + "\")";
                }
                lines.add(line);
            });
        }
        return String.join("\n", lines);
    }
}
