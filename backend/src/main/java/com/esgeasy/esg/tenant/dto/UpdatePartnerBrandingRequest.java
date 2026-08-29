package com.esgeasy.esg.tenant.dto;

import jakarta.validation.constraints.NotBlank;

/** Self-service subset of SavePartnerRequest — a partner can edit its own presentation, not its internal name, subdomain, billing model, or revenue share. */
public record UpdatePartnerBrandingRequest(
        @NotBlank String brandName,
        String logoAsset,
        String primaryColor,
        String supportEmail,
        String emailFromAddress
) {
}
