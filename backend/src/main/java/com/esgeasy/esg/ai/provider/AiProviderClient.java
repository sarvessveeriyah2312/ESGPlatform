package com.esgeasy.esg.ai.provider;

/** One implementation per {@link com.esgeasy.esg.ai.AiProvider}, dispatched via {@link AiProviderClientFactory}. */
public interface AiProviderClient {

    default AiCompletionResult complete(String apiKey, String model, String systemPrompt, String userPrompt) {
        return complete(apiKey, model, systemPrompt, userPrompt, null, null);
    }

    /**
     * Same as {@link #complete(String, String, String, String)}, with an optional image attached
     * to the user turn (used by "Extract with AI" for image evidence — see
     * IndicatorExtractionService). Pass both image params as null for a text-only call.
     */
    AiCompletionResult complete(String apiKey, String model, String systemPrompt, String userPrompt,
                                 String imageMimeType, String imageBase64Data);
}
