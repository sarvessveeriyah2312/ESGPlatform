-- White-label partner records — Phase 1 of WHITELABEL_PLAN.md. A Partner is independent of
-- SubscriptionPlan: a company can be on any plan (Starter through On-Premise) while also being
-- linked to a partner whose brand it's provisioned under. Admin-only CRUD (PartnerController),
-- no partner self-service yet, no brand-resolution/theming wired up yet (later phase).

CREATE TABLE partner (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    brand_name VARCHAR(200) NOT NULL,
    logo_asset VARCHAR(500),
    primary_color VARCHAR(20),
    support_email VARCHAR(255),
    email_from_address VARCHAR(255),
    subdomain_slug VARCHAR(100) UNIQUE,
    billing_model VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Nullable: null means "direct EsgEasy customer" (every existing company today), a non-null value
-- means the company was provisioned under that partner's brand. ON DELETE SET NULL rather than
-- RESTRICT — deleting a partner record shouldn't be blocked by, or cascade-delete, its companies.
ALTER TABLE company ADD COLUMN partner_id UUID REFERENCES partner (id) ON DELETE SET NULL;
CREATE INDEX idx_company_partner ON company (partner_id);
