package com.esgeasy.esg.ai.dto;

import com.esgeasy.esg.ai.AiProvider;
import com.esgeasy.esg.ai.AiProviderConfig;

public record AiProviderConfigResponse(
        boolean configured,
        AiProvider provider,
        String model,
        boolean enabled,
        boolean apiKeySet
) {
    public static AiProviderConfigResponse from(AiProviderConfig c) {
        return new AiProviderConfigResponse(true, c.getProvider(), c.getModel(), Boolean.TRUE.equals(c.getEnabled()), true);
    }

    public static AiProviderConfigResponse notConfigured() {
        return new AiProviderConfigResponse(false, null, null, false, false);
    }
}
