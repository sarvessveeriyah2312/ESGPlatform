package com.esgeasy.esg.security;

import com.esgeasy.esg.user.Role;

import java.util.Set;
import java.util.UUID;

/**
 * scopes is empty for ordinary user-session JWT auth and populated only when the request was
 * authenticated via an API token (see ApiTokenAuthenticationFilter) — external API endpoints are
 * gated on scopes rather than role, so a logged-in browser session can never use them.
 *
 * jti identifies which user_session row backs this request; it is null when authenticated via an
 * API token (those aren't per-device sessions) or via a legacy pre-jti JWT.
 */
public record EsgEasyPrincipal(
        UUID userId,
        UUID companyId,
        /** Set only for a PARTNER_ADMIN principal — see AppUser.partner. */
        UUID partnerId,
        Role role,
        String email,
        Set<String> scopes,
        UUID jti
) {
}
