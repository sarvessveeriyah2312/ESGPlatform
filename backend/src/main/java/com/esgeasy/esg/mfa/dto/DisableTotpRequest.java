package com.esgeasy.esg.mfa.dto;

import jakarta.validation.constraints.NotBlank;

public record DisableTotpRequest(@NotBlank String password, @NotBlank String code) {
}
