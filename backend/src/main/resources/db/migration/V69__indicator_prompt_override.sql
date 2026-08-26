-- Per-company, per-indicator override of the "indicator-value-extraction" prompt used by
-- "Extract with AI" (see IndicatorPromptService). Absent for a given indicator means "use the
-- shared indicator-value-extraction default" — mirrors prompt_template_override's pattern, but
-- keyed by indicator instead of draft_type, since different indicators (e.g. a computed ratio
-- like "Energy Intensity per Revenue" vs a raw consumption figure) can need very different
-- extraction guidance.

CREATE TABLE indicator_prompt_override (
    id                      UUID PRIMARY KEY,
    company_id              UUID NOT NULL REFERENCES company (id) ON DELETE CASCADE,
    indicator_definition_id VARCHAR(30) NOT NULL REFERENCES indicator_definition (id) ON DELETE CASCADE,
    system_prompt           TEXT,
    user_prompt_template    TEXT,
    created_at              TIMESTAMP NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (company_id, indicator_definition_id)
);

CREATE INDEX idx_indicator_prompt_override_company ON indicator_prompt_override (company_id);
