package com.lestari.esg.security;

import com.lestari.esg.user.Role;

import java.util.Set;
import java.util.UUID;

/**
 * scopes is empty for ordinary user-session JWT auth and populated only when the request was
 * authenticated via an API token (see ApiTokenAuthenticationFilter) — external API endpoints are
 * gated on scopes rather than role, so a logged-in browser session can never use them.
 */
public record LestariPrincipal(
        UUID userId,
        UUID companyId,
        Role role,
        String email,
        Set<String> scopes
) {
}
