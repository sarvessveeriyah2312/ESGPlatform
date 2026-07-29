package com.esgeasy.esg.climate.dto;

import com.esgeasy.esg.climate.Currency;
import com.esgeasy.esg.climate.RiskOpportunityType;
import com.esgeasy.esg.climate.TimeHorizon;
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
