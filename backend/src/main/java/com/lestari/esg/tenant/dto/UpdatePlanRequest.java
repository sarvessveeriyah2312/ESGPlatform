package com.lestari.esg.tenant.dto;

import com.lestari.esg.tenant.SubscriptionPlan;
import jakarta.validation.constraints.NotNull;

public record UpdatePlanRequest(@NotNull SubscriptionPlan plan) {
}
