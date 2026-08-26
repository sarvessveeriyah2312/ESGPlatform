package com.esgeasy.esg.tenant.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdatePlanPricingRequest(@NotNull BigDecimal monthlyPrice, @NotNull BigDecimal annualMonthlyPrice) {
}
