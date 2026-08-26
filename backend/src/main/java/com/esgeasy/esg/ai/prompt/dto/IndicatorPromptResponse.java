package com.esgeasy.esg.ai.prompt.dto;

public record IndicatorPromptResponse(
        String indicatorId,
        String indicatorName,
        String unit,
        String systemPrompt,
        String userPromptTemplate,
        boolean isCustomized
) {
}
