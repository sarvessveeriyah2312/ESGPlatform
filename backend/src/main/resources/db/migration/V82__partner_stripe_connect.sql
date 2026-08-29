-- Stripe Connect fields for automated partner revenue share (WHITELABEL_PLAN.md Phase 5). Both
-- nullable and unset by default — a partner with neither set gets no destination charge applied
-- to their companies' payments, same as today.

ALTER TABLE partner ADD COLUMN stripe_account_id VARCHAR(255);
ALTER TABLE partner ADD COLUMN revenue_share_percent NUMERIC(5, 2);
