package com.lestari.esg.mfa.dto;

import jakarta.validation.constraints.NotBlank;

public record VerifyTotpRequest(@NotBlank String code) {
}
