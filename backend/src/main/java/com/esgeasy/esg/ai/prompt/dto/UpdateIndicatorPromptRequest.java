package com.esgeasy.esg.ai.prompt.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateIndicatorPromptRequest(
        @NotBlank String systemPrompt,
        @NotBlank String userPromptTemplate
) {
}
