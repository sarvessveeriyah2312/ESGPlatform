package com.esgeasy.esg.indicators.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;

/**
 * Result of "Extract with AI" — a suggestion the user reviews before it's saved, never applied
 * automatically. {@code value} is null when the AI couldn't find a value in the evidence; it's
 * force-included even as null (overriding the app-wide non_null Jackson default in
 * application.yml) so the frontend reliably sees the key rather than it being silently absent.
 */
public record ExtractionResponse(
        @JsonInclude(JsonInclude.Include.ALWAYS) BigDecimal value,
        String confidence,
        String sourceQuote,
        String reason) {
}
