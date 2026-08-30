-- Narrative content for the ESG Disclosure Summary Report (CEO statement, company overview, etc.)
-- and a proper risk/opportunity matrix (likelihood/severity/mitigation/category) for the IFRS S1
-- Risks & Opportunities section — both added to bring the generated report in line with a standard
-- annual ESG report structure (CEO Statement, About This Report, Company Overview, Risk Matrix).

CREATE TABLE report_narrative (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL UNIQUE REFERENCES company (id) ON DELETE CASCADE,
    ceo_statement TEXT,
    report_scope_description TEXT,
    company_overview TEXT,
    esg_strategy_narrative TEXT,
    sustainability_email VARCHAR(255),
    investor_relations_email VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

ALTER TABLE s1_risk_opportunity
    ADD COLUMN category VARCHAR(60),
    ADD COLUMN likelihood VARCHAR(10),
    ADD COLUMN impact_severity VARCHAR(10),
    ADD COLUMN mitigation_approach TEXT;
