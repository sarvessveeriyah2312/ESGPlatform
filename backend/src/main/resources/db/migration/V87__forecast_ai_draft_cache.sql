-- Caches the last AI-generated forecast narrative and action plan per (company, indicator) so
-- revisiting AI Forecasting doesn't re-call the provider (and re-spend tokens) just to redisplay
-- the same text — the user must explicitly click "Regenerate" to call the AI again.

CREATE TABLE forecast_ai_draft (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES company (id) ON DELETE CASCADE,
    indicator_definition_id VARCHAR(30) NOT NULL REFERENCES indicator_definition (id) ON DELETE CASCADE,
    narrative TEXT,
    action_plan TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (company_id, indicator_definition_id)
);
