package com.esgeasy.esg.tenant.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/** Shared shape for create and update — a partner has no fields that are only ever set once. */
public record SavePartnerRequest(
        @NotBlank String name,
        @NotBlank String brandName,
        String logoAsset,
        String primaryColor,
        String supportEmail,
        String emailFromAddress,
        String subdomainSlug,
        String billingModel,
        /** Null leaves revenue share disabled — see Partner.revenueSharePercent. Connect account id is never set here; that's PartnerService.startStripeConnectOnboarding's job. */
        @DecimalMin("0") @DecimalMax("100") BigDecimal revenueSharePercent
) {
}
