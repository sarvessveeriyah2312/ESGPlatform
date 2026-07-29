package com.esgeasy.esg.reference.dto;

import com.esgeasy.esg.reference.FeatureFlag;
import com.esgeasy.esg.tenant.SubscriptionPlan;

public record FeatureFlagResponse(
        String featureKey,
        SubscriptionPlan minPlan,
        boolean visibleOnlyAtMinPlan
) {
    public static FeatureFlagResponse from(FeatureFlag f) {
        return new FeatureFlagResponse(f.getFeatureKey(), f.getMinPlan(), Boolean.TRUE.equals(f.getVisibleOnlyAtMinPlan()));
    }
}
