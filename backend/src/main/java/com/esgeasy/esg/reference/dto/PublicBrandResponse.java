package com.esgeasy.esg.reference.dto;

/**
 * Pre-login brand resolution for a partner's subdomain — distinct
 * from {@code MeResponse}'s brand fields, which resolve from an authenticated user's own company.
 * Never 404s: an unknown or absent subdomain resolves to EsgEasy's own defaults, since this backs
 * a public login/register page that must render something either way.
 */
public record PublicBrandResponse(String brandName, String logoUrl, String primaryColor) {

    public static final PublicBrandResponse ESGEASY_DEFAULT = new PublicBrandResponse("EsgEasy", null, null);
}
