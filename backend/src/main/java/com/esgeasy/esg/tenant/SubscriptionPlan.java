package com.esgeasy.esg.tenant;

public enum SubscriptionPlan {
    STARTER(1),
    GROWTH(2),
    ISSUER_READY(3),
    /** On-premise / enterprise contract tier — provisioned directly by a platform admin
     *  (CompanyService.adminUpdatePlan), never via self-serve Stripe checkout. */
    ON_PREM(4);

    private final int level;

    SubscriptionPlan(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }

    public boolean atLeast(SubscriptionPlan other) {
        return this.level >= other.level;
    }
}
