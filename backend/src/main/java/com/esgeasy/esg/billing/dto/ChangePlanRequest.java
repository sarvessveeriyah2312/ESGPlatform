package com.esgeasy.esg.billing.dto;

import com.esgeasy.esg.tenant.SubscriptionPlan;
import jakarta.validation.constraints.NotNull;

public record ChangePlanRequest(@NotNull SubscriptionPlan targetPlan) {
}
