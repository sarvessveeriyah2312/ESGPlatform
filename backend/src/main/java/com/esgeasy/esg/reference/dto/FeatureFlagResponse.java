package com.lestari.esg.reference.dto;

import com.lestari.esg.reference.FeatureFlag;
import com.lestari.esg.tenant.SubscriptionPlan;

public record FeatureFlagResponse(
        String featureKey,
        SubscriptionPlan minPlan,
        boolean visibleOnlyAtMinPlan
) {
    public static FeatureFlagResponse from(FeatureFlag f) {
        return new FeatureFlagResponse(f.getFeatureKey(), f.getMinPlan(), Boolean.TRUE.equals(f.getVisibleOnlyAtMinPlan()));
    }
}
