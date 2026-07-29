package com.lestari.esg.climate.dto;

import com.lestari.esg.climate.Currency;
import com.lestari.esg.climate.RiskOpportunityType;
import com.lestari.esg.climate.TimeHorizon;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpsertS1ItemRequest(
        @NotBlank String title,
        @NotNull RiskOpportunityType type,
        String description,
        @NotNull TimeHorizon horizon,
        BigDecimal financialImpact,
        @NotNull Currency currency
) {
}
