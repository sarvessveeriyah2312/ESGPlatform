package com.lestari.esg.tenant;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PlanPricingRepository extends JpaRepository<PlanPricing, SubscriptionPlan> {
}
