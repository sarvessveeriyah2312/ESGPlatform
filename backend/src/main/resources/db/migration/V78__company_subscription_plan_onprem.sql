-- Adds ON_PREM everywhere a company's own live subscription_plan gets stored, so persisting an
-- on-prem company doesn't violate a check constraint written before ON_PREM existed — see
-- SubscriptionPlan.java and ONPREM_PLAN.md.
--
-- Deliberately NOT touched: feature_flag.min_plan, matter_set_rule.min_plan, plan_pricing.plan
-- (V3__reference_schema.sql, V15__plan_pricing.sql) — those store thresholds/pricing for the 3
-- self-serve tiers only, never a company's own plan value, and ON_PREM is intentionally excluded
-- from all three (nothing should require ON_PREM as a minimum, and it has no list price).

ALTER TABLE company DROP CONSTRAINT company_subscription_plan_check;
ALTER TABLE company ADD CONSTRAINT company_subscription_plan_check
    CHECK (subscription_plan IN ('STARTER', 'GROWTH', 'ISSUER_READY', 'ON_PREM'));

-- materiality_assessment.plan_at_capture snapshots Company.subscriptionPlan at the moment an
-- assessment is created (MaterialityService.createAssessment) — same bug, same fix.
ALTER TABLE materiality_assessment DROP CONSTRAINT materiality_assessment_plan_at_capture_check;
ALTER TABLE materiality_assessment ADD CONSTRAINT materiality_assessment_plan_at_capture_check
    CHECK (plan_at_capture IN ('STARTER', 'GROWTH', 'ISSUER_READY', 'ON_PREM'));
