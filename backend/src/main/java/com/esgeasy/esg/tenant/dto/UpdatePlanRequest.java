package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.tenant.SubscriptionPlan;
import jakarta.validation.constraints.NotNull;

public record UpdatePlanRequest(@NotNull SubscriptionPlan plan) {
}
