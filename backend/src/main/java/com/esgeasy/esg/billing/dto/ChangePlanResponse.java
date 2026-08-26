package com.esgeasy.esg.billing.dto;

import com.esgeasy.esg.tenant.SubscriptionPlan;

public record ChangePlanResponse(SubscriptionPlan plan, String message) {
}
