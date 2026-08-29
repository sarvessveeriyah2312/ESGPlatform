-- Lets a white-label partner actually log in and see only their own companies
-- (WHITELABEL_PLAN.md Phase 4) — until now Partner was pure metadata nobody could authenticate as.

INSERT INTO roles (code, name, description) VALUES
    ('PARTNER_ADMIN', 'Partner Admin', 'A white-label partner''s own login — read-only visibility into the companies provisioned under their brand. No company of their own, same as Platform Admin.');

-- Nullable, same convention as company.partner_id (V80) — null means "not a partner-admin user".
-- A PARTNER_ADMIN row has this set and company_id null; every other role has the reverse.
ALTER TABLE app_user ADD COLUMN partner_id UUID REFERENCES partner (id) ON DELETE SET NULL;
CREATE INDEX idx_app_user_partner ON app_user (partner_id);
