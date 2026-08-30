package com.esgeasy.esg.forecasting.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** How an indicator's trend projection compares to a linked PerformanceTarget, if one exists. */
public record TargetAlignmentDto(
        UUID targetId,
        String targetTitle,
        int targetYear,
        BigDecimal targetValue,
        BigDecimal projectedValueAtTargetYear,
        ForecastStatus status
) {
}
