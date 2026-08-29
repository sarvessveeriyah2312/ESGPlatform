-- Enables self-serve, one-time-payment purchase of the ON_PREM plan via Stripe Checkout (mode
-- 'payment' instead of 'subscription' — see CompanyBillingService.createCheckoutSession). Unlike
-- STARTER/GROWTH/ISSUER_READY, this is a single charge, not a recurring monthly subscription.
--
-- monthly_price is reused as the one-time price (column name is legacy from when every plan was
-- recurring) — annual_monthly_price is set equal to it since on-prem has no annual-billing toggle
-- and the column is NOT NULL. Both are placeholder figures — edit via direct SQL or a future
-- Plan Management UI enhancement (ON_PREM is deliberately excluded from that page's pricing cards
-- today; see admin/constants.ts PLAN_ORDER).

ALTER TABLE plan_pricing DROP CONSTRAINT plan_pricing_plan_check;
ALTER TABLE plan_pricing ADD CONSTRAINT plan_pricing_plan_check
    CHECK (plan IN ('STARTER', 'GROWTH', 'ISSUER_READY', 'ON_PREM'));

INSERT INTO plan_pricing (plan, monthly_price, annual_monthly_price)
VALUES ('ON_PREM', 25000.00, 25000.00);
