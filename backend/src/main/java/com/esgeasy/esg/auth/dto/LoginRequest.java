package com.esgeasy.esg.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank String email,
        @NotBlank String password,
        boolean rememberMe,
        /** The partner subdomain slug the frontend resolved from its own hostname (see useSubdomainBrand.resolveSubdomainSlug), if any — null/blank on the bare app domain. Lets AuthService reject a login whose account doesn't belong to that partner. */
        String partnerSlug
) {
}
