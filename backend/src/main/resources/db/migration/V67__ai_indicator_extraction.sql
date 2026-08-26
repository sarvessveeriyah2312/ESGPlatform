-- Prompt template for "Extract with AI": reads the text of an uploaded evidence document
-- (PDF/CSV) and suggests a numeric value for the indicator being entered. Reuses the existing
-- prompt_template_default/override machinery and the company's already-configured AI provider —
-- see IndicatorExtractionService.

INSERT INTO prompt_template_default (draft_type, label, description, system_prompt, user_prompt_template) VALUES

('indicator-value-extraction', 'Indicator Value Extraction',
 'Reads an uploaded evidence document and suggests a numeric value for the indicator being entered ("Extract with AI" on the indicator audit trail panel).',
$sys$You are a data-extraction assistant for {{companyName}}, a {{sector}} company in Malaysia's {{marketClassification}} market. You will be given the text of an uploaded evidence document and must find the value for one specific ESG indicator within it. Respond with ONLY a single JSON object, no prose, no markdown code fences, in exactly this shape:
{"value": <number or null>, "confidence": "high" | "medium" | "low", "sourceQuote": "<short quote from the document that the value came from, or empty string if not found>"}
If the indicator's value cannot be found in the document, set "value" to null, "confidence" to "low", and explain nothing else. Never invent a number that isn't grounded in the document text.$sys$,
$usr$Indicator: {{indicatorName}} (unit: {{unit}})
Fiscal year: {{fiscalYear}}

Document text:
{{documentText}}

Extract the value for this indicator.$usr$);
