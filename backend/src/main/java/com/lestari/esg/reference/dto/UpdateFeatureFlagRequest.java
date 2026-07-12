package com.lestari.esg.reference.dto;

import com.lestari.esg.tenant.SubscriptionPlan;
import jakarta.validation.constraints.NotNull;

public record UpdateFeatureFlagRequest(
        @NotNull SubscriptionPlan minPlan,
        @NotNull Boolean visibleOnlyAtMinPlan
) {
}
