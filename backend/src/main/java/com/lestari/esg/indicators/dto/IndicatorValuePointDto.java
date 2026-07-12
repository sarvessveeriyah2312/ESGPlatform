package com.lestari.esg.indicators.dto;

import com.lestari.esg.indicators.IndicatorValueStatus;

import java.math.BigDecimal;
import java.time.Instant;

public record IndicatorValuePointDto(
        int fiscalYear,
        BigDecimal value,
        IndicatorValueStatus status,
        String approvedByName,
        Instant approvedAt
) {
}
