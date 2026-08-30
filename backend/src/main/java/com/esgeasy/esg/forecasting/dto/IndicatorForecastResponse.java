package com.esgeasy.esg.forecasting.dto;

import java.util.List;

/** Full forecast detail for one indicator: its actual history plus trend-projected future points. */
public record IndicatorForecastResponse(
        String indicatorId,
        String indicatorName,
        String unit,
        List<ForecastPointDto> points,
        TrendDirection trendDirection,
        TargetAlignmentDto targetAlignment
) {
}
