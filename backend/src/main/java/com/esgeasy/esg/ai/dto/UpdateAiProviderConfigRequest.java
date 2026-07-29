package com.esgeasy.esg.ai.dto;

import com.esgeasy.esg.ai.AiProvider;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateAiProviderConfigRequest(
        @NotNull AiProvider provider,
        @NotBlank String model,
        /** Blank/omitted keeps the existing stored key (e.g. when only changing the model). Required the first time a provider is configured, or whenever the provider is changed. */
        String apiKey,
        @NotNull Boolean enabled
) {
}
