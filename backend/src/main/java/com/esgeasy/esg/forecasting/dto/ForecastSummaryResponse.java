package com.esgeasy.esg.forecasting.dto;

import java.math.BigDecimal;

/** One row of the forecasting overview list — every enabled indicator with enough history (2+ recorded fiscal years) to fit a trend. */
public record ForecastSummaryResponse(
        String indicatorId,
        String indicatorName,
        String unit,
        int lastActualYear,
        BigDecimal lastActualValue,
        TrendDirection trendDirection,
        int projectionYear,
        BigDecimal projectedValue,
        TargetAlignmentDto targetAlignment
) {
}
