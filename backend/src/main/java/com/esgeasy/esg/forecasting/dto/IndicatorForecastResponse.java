package com.esgeasy.esg.forecasting.dto;

import java.util.List;

/** Full forecast detail for one indicator: its actual history plus trend-projected future points.
 *  {@code narrative}/{@code actionPlan} carry the last AI draft cached for this indicator, if any —
 *  letting the frontend redisplay them on load without spending a new AI call. */
public record IndicatorForecastResponse(
        String indicatorId,
        String indicatorName,
        String unit,
        List<ForecastPointDto> points,
        TrendDirection trendDirection,
        TargetAlignmentDto targetAlignment,
        String narrative,
        String actionPlan
) {
}
