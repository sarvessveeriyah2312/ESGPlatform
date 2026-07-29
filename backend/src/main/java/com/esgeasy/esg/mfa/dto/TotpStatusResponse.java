package com.esgeasy.esg.mfa.dto;

import java.time.Instant;

public record TotpStatusResponse(boolean enabled, Instant enabledAt) {
}
