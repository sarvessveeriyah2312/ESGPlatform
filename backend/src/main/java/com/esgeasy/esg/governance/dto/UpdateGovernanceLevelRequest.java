package com.esgeasy.esg.governance.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateGovernanceLevelRequest(
        @NotBlank String roleTitle,
        String description
) {
}
