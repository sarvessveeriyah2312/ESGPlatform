package com.esgeasy.esg.auth.dto;

import com.esgeasy.esg.tenant.MarketClassification;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OnboardingRequest(
        @NotNull MarketClassification market,
        String sectorCode,
        List<String> frameworks,
        List<String> priorities
) {
}
