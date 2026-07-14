package com.lestari.esg.tenant.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateSubsidiaryRequest(
        @NotBlank String name
) {
}
