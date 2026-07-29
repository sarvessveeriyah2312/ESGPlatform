package com.esgeasy.esg.reference.dto;

import com.esgeasy.esg.tenant.SubscriptionPlan;
import jakarta.validation.constraints.NotNull;

public record UpdateFeatureFlagRequest(
        @NotNull SubscriptionPlan minPlan,
        @NotNull Boolean visibleOnlyAtMinPlan
) {
}
