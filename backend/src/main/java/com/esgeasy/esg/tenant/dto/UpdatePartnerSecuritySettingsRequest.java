package com.esgeasy.esg.tenant.dto;

import jakarta.validation.constraints.NotNull;

public record UpdatePartnerSecuritySettingsRequest(@NotNull Boolean mfaRequiredForTeam) {
}
