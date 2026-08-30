package com.esgeasy.esg.forecasting;

import com.esgeasy.esg.ai.AiDraftService;
import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.forecasting.dto.ForecastNarrativeResponse;
import com.esgeasy.esg.forecasting.dto.ForecastPointDto;
import com.esgeasy.esg.forecasting.dto.ForecastStatus;
import com.esgeasy.esg.forecasting.dto.ForecastSummaryResponse;
import com.esgeasy.esg.forecasting.dto.IndicatorForecastResponse;
import com.esgeasy.esg.forecasting.dto.TargetAlignmentDto;
import com.esgeasy.esg.forecasting.dto.TrendDirection;
import com.esgeasy.esg.indicators.IndicatorValue;
import com.esgeasy.esg.indicators.IndicatorValueRepository;
import com.esgeasy.esg.indicators.TenantIndicator;
import com.esgeasy.esg.indicators.TenantIndicatorRepository;
import com.esgeasy.esg.reference.IndicatorDefinition;
import com.esgeasy.esg.reference.IndicatorDefinitionRepository;
import com.esgeasy.esg.reference.MatterSetResolverService;
import com.esgeasy.esg.reference.SustainabilityMatter;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.targets.PerformanceTarget;
import com.esgeasy.esg.targets.PerformanceTargetRepository;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Computes trend-projected forecasts for indicators from recorded {@link IndicatorValue} history
 * (linear regression — see {@link LinearTrend}) and compares the projection against any linked
 * {@link PerformanceTarget}. The projection itself is deterministic and never persisted; only the
 * optional AI narrative ({@link #generateNarrative}) makes a paid provider call, via the same
 * {@link AiDraftService} orchestration used by every other "Draft with AI" feature.
 */
@Service
public class ForecastingService {

    /** Trend-projection years beyond the last recorded value when no target is linked. */
    private static final int DEFAULT_HORIZON_YEARS = 3;
    /** Slope-per-year magnitude below this fraction of the series average is presented as FLAT rather than a spurious direction. */
    private static final double FLAT_THRESHOLD_RATIO = 0.005;
    /** A projection landing within this fraction of the remaining baseline-to-target gap is AT_RISK rather than OFF_TRACK. */
    private static final double AT_RISK_GAP_RATIO = 0.2;

    private final IndicatorDefinitionRepository indicatorDefinitionRepository;
    private final TenantIndicatorRepository tenantIndicatorRepository;
    private final IndicatorValueRepository indicatorValueRepository;
    private final PerformanceTargetRepository performanceTargetRepository;
    private final MatterSetResolverService matterSetResolverService;
    private final CompanyRepository companyRepository;
    private final CurrentUserProvider currentUserProvider;
    private final AiDraftService aiDraftService;

    public ForecastingService(IndicatorDefinitionRepository indicatorDefinitionRepository,
                               TenantIndicatorRepository tenantIndicatorRepository,
                               IndicatorValueRepository indicatorValueRepository,
                               PerformanceTargetRepository performanceTargetRepository,
                               MatterSetResolverService matterSetResolverService,
                               CompanyRepository companyRepository,
                               CurrentUserProvider currentUserProvider,
                               AiDraftService aiDraftService) {
        this.indicatorDefinitionRepository = indicatorDefinitionRepository;
        this.tenantIndicatorRepository = tenantIndicatorRepository;
        this.indicatorValueRepository = indicatorValueRepository;
        this.performanceTargetRepository = performanceTargetRepository;
        this.matterSetResolverService = matterSetResolverService;
        this.companyRepository = companyRepository;
        this.currentUserProvider = currentUserProvider;
        this.aiDraftService = aiDraftService;
    }

    @Transactional(readOnly = true)
    public List<ForecastSummaryResponse> list() {
        UUID companyId = currentUserProvider.requireCompanyId();
        List<PerformanceTarget> targets = performanceTargetRepository.findByCompanyId(companyId);

        return forecastableDefinitions(companyId).stream()
                .map(def -> buildForecast(companyId, def, targets))
                .filter(Objects::nonNull)
                .map(f -> new ForecastSummaryResponse(
                        f.def.getId(), f.def.getName(), f.def.getUnit(),
                        f.lastActualYear, f.lastActualValue, f.trendDirection,
                        f.projectionYear, f.projectedValue, f.targetAlignment))
                .toList();
    }

    @Transactional(readOnly = true)
    public IndicatorForecastResponse getForecast(String indicatorDefinitionId) {
        UUID companyId = currentUserProvider.requireCompanyId();
        IndicatorDefinition def = indicatorDefinitionRepository.findById(indicatorDefinitionId)
                .orElseThrow(() -> new NotFoundException("Unknown indicator id: " + indicatorDefinitionId));
        List<PerformanceTarget> targets = performanceTargetRepository.findByCompanyId(companyId);

        Forecast f = buildForecast(companyId, def, targets);
        if (f == null) {
            throw new NotFoundException("Not enough recorded history to forecast this indicator (need at least 2 fiscal years)");
        }

        List<ForecastPointDto> points = new java.util.ArrayList<>();
        f.actuals.forEach((year, value) -> points.add(new ForecastPointDto(year, value, false)));
        for (int year : LinearTrend.yearsBetween(f.lastActualYear, f.projectionYear)) {
            points.add(new ForecastPointDto(year, f.trend.predict(year), true));
        }
        points.sort(Comparator.comparingInt(ForecastPointDto::fiscalYear));

        return new IndicatorForecastResponse(def.getId(), def.getName(), def.getUnit(), points, f.trendDirection, f.targetAlignment);
    }

    @Transactional
    public ForecastNarrativeResponse generateNarrative(String indicatorDefinitionId) {
        IndicatorForecastResponse forecast = getForecast(indicatorDefinitionId);

        String historicalSummary = forecast.points().stream()
                .filter(p -> !p.projected())
                .map(p -> "FY" + p.fiscalYear() + ": " + p.value())
                .collect(Collectors.joining(", "));

        var lastProjected = forecast.points().stream()
                .filter(ForecastPointDto::projected)
                .max(Comparator.comparingInt(ForecastPointDto::fiscalYear))
                .orElseThrow(() -> new NotFoundException("No projected point available for this indicator"));

        String targetSummary = forecast.targetAlignment() == null
                ? "No linked target."
                : "Target: %s %s by %d (currently trending %s)".formatted(
                        forecast.targetAlignment().targetValue(), forecast.unit(),
                        forecast.targetAlignment().targetYear(), forecast.targetAlignment().status());

        Map<String, String> context = new HashMap<>();
        context.put("indicatorName", forecast.indicatorName());
        context.put("unit", forecast.unit());
        context.put("historicalSummary", historicalSummary);
        context.put("trendDirection", forecast.trendDirection().name());
        context.put("projectionYear", String.valueOf(lastProjected.fiscalYear()));
        context.put("projectedValue", String.valueOf(lastProjected.value()));
        context.put("targetSummary", targetSummary);

        String text = aiDraftService.complete("forecast", "forecast-narrative", context);
        return new ForecastNarrativeResponse(text);
    }

    private List<IndicatorDefinition> forecastableDefinitions(UUID companyId) {
        Company company = companyRepository.findById(companyId).orElseThrow(() -> new NotFoundException("Company not found"));
        List<String> matterIds = matterSetResolverService.resolveApplicableMatters(company).stream()
                .map(SustainabilityMatter::getId)
                .toList();
        List<IndicatorDefinition> defs = indicatorDefinitionRepository.findByMatterIdIn(matterIds);
        List<String> defIds = defs.stream().map(IndicatorDefinition::getId).toList();

        Map<String, TenantIndicator> overrides = tenantIndicatorRepository
                .findByCompanyIdAndIndicatorDefinitionIdIn(companyId, defIds).stream()
                .collect(Collectors.toMap(ti -> ti.getIndicatorDefinition().getId(), ti -> ti));

        return defs.stream()
                .filter(def -> {
                    TenantIndicator override = overrides.get(def.getId());
                    return override == null || Boolean.TRUE.equals(override.getEnabled());
                })
                .toList();
    }

    private Forecast buildForecast(UUID companyId, IndicatorDefinition def, List<PerformanceTarget> targets) {
        Map<Integer, BigDecimal> actuals = indicatorValueRepository
                .findByCompanyIdAndIndicatorDefinitionId(companyId, def.getId()).stream()
                .filter(v -> v.getValue() != null)
                .collect(Collectors.toMap(IndicatorValue::getFiscalYear, IndicatorValue::getValue,
                        (a, b) -> b, TreeMap::new));
        if (actuals.size() < 2) {
            return null;
        }

        LinearTrend trend = LinearTrend.fit(actuals);
        int lastActualYear = ((TreeMap<Integer, BigDecimal>) actuals).lastKey();
        BigDecimal lastActualValue = actuals.get(lastActualYear);

        double average = actuals.values().stream().mapToDouble(BigDecimal::doubleValue).average().orElse(0);
        TrendDirection direction;
        if (average == 0 || Math.abs(trend.slopePerYear()) < Math.abs(average) * FLAT_THRESHOLD_RATIO) {
            direction = TrendDirection.FLAT;
        } else {
            direction = trend.slopePerYear() > 0 ? TrendDirection.INCREASING : TrendDirection.DECREASING;
        }

        PerformanceTarget linkedTarget = targets.stream()
                .filter(t -> t.getIndicatorDefinition() != null && t.getIndicatorDefinition().getId().equals(def.getId()))
                .min(Comparator.comparingInt(PerformanceTarget::getTargetYear))
                .orElse(null);

        int projectionYear = linkedTarget != null
                ? Math.max(linkedTarget.getTargetYear(), lastActualYear + 1)
                : lastActualYear + DEFAULT_HORIZON_YEARS;
        BigDecimal projectedValue = trend.predict(projectionYear);

        TargetAlignmentDto alignment = linkedTarget == null ? null : new TargetAlignmentDto(
                linkedTarget.getId(), linkedTarget.getTitle(), linkedTarget.getTargetYear(), linkedTarget.getTargetValue(),
                trend.predict(linkedTarget.getTargetYear()),
                computeStatus(lastActualValue, linkedTarget.getTargetValue(), trend.predict(linkedTarget.getTargetYear())));

        Forecast f = new Forecast();
        f.def = def;
        f.actuals = actuals;
        f.trend = trend;
        f.lastActualYear = lastActualYear;
        f.lastActualValue = lastActualValue;
        f.trendDirection = direction;
        f.projectionYear = projectionYear;
        f.projectedValue = projectedValue;
        f.targetAlignment = alignment;
        return f;
    }

    /**
     * ON_TRACK when the trend already meets/beats the target by the target year; AT_RISK when the
     * remaining gap at that point is still within {@link #AT_RISK_GAP_RATIO} of the original
     * baseline-to-target gap; OFF_TRACK otherwise. Direction (reduction vs. growth) is inferred by
     * comparing the target to the last actual, same convention as PerformanceTargetService.
     */
    private ForecastStatus computeStatus(BigDecimal lastActual, BigDecimal targetValue, BigDecimal projectedAtTargetYear) {
        boolean reduction = targetValue.compareTo(lastActual) < 0;
        BigDecimal gapToClose = reduction ? lastActual.subtract(targetValue) : targetValue.subtract(lastActual);
        if (gapToClose.signum() <= 0) {
            return ForecastStatus.ON_TRACK;
        }
        BigDecimal remainingGap = reduction
                ? projectedAtTargetYear.subtract(targetValue)
                : targetValue.subtract(projectedAtTargetYear);
        if (remainingGap.signum() <= 0) {
            return ForecastStatus.ON_TRACK;
        }
        double ratio = remainingGap.doubleValue() / gapToClose.doubleValue();
        return ratio <= AT_RISK_GAP_RATIO ? ForecastStatus.AT_RISK : ForecastStatus.OFF_TRACK;
    }

    private static final class Forecast {
        IndicatorDefinition def;
        Map<Integer, BigDecimal> actuals;
        LinearTrend trend;
        int lastActualYear;
        BigDecimal lastActualValue;
        TrendDirection trendDirection;
        int projectionYear;
        BigDecimal projectedValue;
        TargetAlignmentDto targetAlignment;
    }
}
