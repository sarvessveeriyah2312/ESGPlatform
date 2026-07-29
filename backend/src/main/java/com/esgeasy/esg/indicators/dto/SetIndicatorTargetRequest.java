package com.lestari.esg.indicators.dto;

import com.lestari.esg.reference.TargetDirection;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record SetIndicatorTargetRequest(
        @NotNull BigDecimal target,
        @NotNull TargetDirection targetDirection
) {
}
