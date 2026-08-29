package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.tenant.Partner;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PartnerResponse(
        UUID id,
        String name,
        String brandName,
        String logoAsset,
        String primaryColor,
        String supportEmail,
        String emailFromAddress,
        String subdomainSlug,
        String billingModel,
        BigDecimal revenueSharePercent,
        boolean stripeConnected,
        Instant createdAt
) {
    public static PartnerResponse from(Partner p) {
        return new PartnerResponse(p.getId(), p.getName(), p.getBrandName(), p.getLogoAsset(),
                p.getPrimaryColor(), p.getSupportEmail(), p.getEmailFromAddress(),
                p.getSubdomainSlug(), p.getBillingModel(), p.getRevenueSharePercent(),
                p.getStripeAccountId() != null, p.getCreatedAt());
    }
}
