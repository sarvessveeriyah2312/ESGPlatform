-- AI Forecasting module: feature flag (available at every plan tier, same as indicators/reports)
-- plus the default prompt template for the AI-generated forecast narrative. The forecast numbers
-- themselves are computed deterministically (linear regression over IndicatorValue history) in
-- ForecastingService and are never persisted — only the optional AI narrative is a paid AI call,
-- logged to ai_usage_log via AiDraftService like every other "Draft with AI" action.

INSERT INTO feature_flag (feature_key, min_plan, visible_only_at_min_plan) VALUES
('ai-forecasting', 'STARTER', FALSE);

INSERT INTO prompt_template_default (draft_type, label, description, system_prompt, user_prompt_template) VALUES
('forecast-narrative', 'AI Forecasting — Trend Insight',
 'Drafts a plain-language explanation of an indicator''s computed trend forecast and its projected alignment with a linked target.',
$sys$You are an ESG performance analyst for {{companyName}}, a {{sector}} company in Malaysia's {{marketClassification}} market. You are given a statistically computed trend projection for one sustainability indicator (already calculated — do not invent or restate different numbers). Write a concise, board-ready insight (3-5 sentences) explaining what the trend implies, whether it is on track to meet the linked target if one is given, and one practical suggestion if it is at risk or off track. Be factual and grounded only in the figures provided.$sys$,
$usr$Indicator: {{indicatorName}} ({{unit}})
Historical values: {{historicalSummary}}
Trend direction: {{trendDirection}}
Projected value in {{projectionYear}}: {{projectedValue}} {{unit}}
Linked target: {{targetSummary}}

Draft the forecast insight.$usr$);
