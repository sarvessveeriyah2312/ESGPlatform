package com.lestari.esg.auth.dto;

public record AuthResponse(
        String token,
        MeResponse user
) {
}
