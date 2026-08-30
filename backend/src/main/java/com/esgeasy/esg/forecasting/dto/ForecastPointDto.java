package com.esgeasy.esg.forecasting.dto;

import java.math.BigDecimal;

/** One year of an indicator's forecast series — either a recorded actual or a trend-projected value. */
public record ForecastPointDto(
        int fiscalYear,
        BigDecimal value,
        boolean projected
) {
}
