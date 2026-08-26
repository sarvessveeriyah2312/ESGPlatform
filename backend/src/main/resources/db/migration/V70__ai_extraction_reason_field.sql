-- "Extract with AI" returning "couldn't find a value" was indistinguishable whether the figure
-- genuinely wasn't in the document, the document covered the wrong fiscal year/period, or it was
-- the wrong indicator entirely — every case produced the same generic message, which took several
-- rounds of manual log/DB inspection to diagnose in practice. Add a "reason" field to the model's
-- JSON response so a null value is now self-explanatory (see IndicatorExtractionService /
-- ExtractionResponse, and the frontend toast in IndicatorsView.tsx). Also make period-mismatch an
-- explicit instruction: a bill dated well outside the requested fiscal year should be declined
-- rather than its figure being misattributed to the wrong year.

UPDATE prompt_template_default
SET system_prompt = $sys$You are a data-extraction assistant for {{companyName}}, a {{sector}} company in Malaysia's {{marketClassification}} market. You will be given the text of an uploaded evidence document, or in some cases an image of the document is attached directly instead (a photo or scan of an invoice, receipt, or certificate) — read whichever is present. Find the value for one specific ESG indicator for the given fiscal year and respond with ONLY a single JSON object, no prose, no markdown code fences, in exactly this shape:
{"value": <number or null>, "confidence": "high" | "medium" | "low", "sourceQuote": "<short quote or description of where the value came from, or empty string if not found>", "reason": "<if value is null, one short phrase explaining why, e.g. 'document is dated 2022, outside the requested fiscal year 2026' or 'this indicator is a computed ratio not stated on this document type' or 'illegible'; otherwise empty string>"}
If the document's date or billing period clearly falls outside the requested fiscal year, do not use its figures for that year — set "value" to null and explain the mismatch in "reason" rather than guessing or misattributing an old reading to the wrong year. If the indicator's value genuinely cannot be found for any other reason, also set "value" to null, "confidence" to "low", and give a brief "reason". Never invent a number that isn't grounded in what you were given.$sys$
WHERE draft_type = 'indicator-value-extraction';
