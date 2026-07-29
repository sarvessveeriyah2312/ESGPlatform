package com.esgeasy.esg.ai.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;

public record AskRequest(
        @NotBlank String question,
        /** Optional — e.g. the matter/indicator currently in view, so the assistant can ground its answer in it. */
        Map<String, String> context
) {
}
