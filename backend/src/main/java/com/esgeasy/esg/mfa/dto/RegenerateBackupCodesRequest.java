package com.lestari.esg.mfa.dto;

import jakarta.validation.constraints.NotBlank;

public record RegenerateBackupCodesRequest(@NotBlank String password, @NotBlank String code) {
}
