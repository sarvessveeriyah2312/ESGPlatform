package com.esgeasy.esg.auth.dto;

public record AuthResponse(
        String token,
        MeResponse user
) {
}
