package com.esgeasy.esg.tenant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "plan_pricing")
@Getter
@Setter
@NoArgsConstructor
public class PlanPricing {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private SubscriptionPlan plan;

    @Column(name = "monthly_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyPrice;

    /** The monthly-equivalent price when billed annually (i.e. annual total / 12) — shown on the public pricing page's "Billed Annually" toggle. */
    @Column(name = "annual_monthly_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal annualMonthlyPrice;

    /**
     * Lazily created on first use (see CompanyBillingService.ensureStripeProduct) rather than
     * seeded up front — Stripe's subscription-update endpoint requires an existing
     * {@code price_data[product]}, unlike Checkout Session creation which accepts an inline
     * {@code product_data} to create one ad hoc; this is what changeSubscriptionPlan references
     * instead. Reused across price changes so admin-edited monthlyPrice doesn't need a new product.
     */
    @Column(name = "stripe_product_id")
    private String stripeProductId;
}
