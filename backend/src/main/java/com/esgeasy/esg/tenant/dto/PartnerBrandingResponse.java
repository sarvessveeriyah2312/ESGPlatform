package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.tenant.Partner;

/** A partner's own view of their editable branding — deliberately excludes name/subdomainSlug/billingModel/revenueSharePercent/Stripe fields, which stay platform-admin-only. */
public record PartnerBrandingResponse(
        String brandName,
        String logoAsset,
        String primaryColor,
        String supportEmail,
        String emailFromAddress
) {
    public static PartnerBrandingResponse from(Partner p) {
        return new PartnerBrandingResponse(p.getBrandName(), p.getLogoAsset(), p.getPrimaryColor(),
                p.getSupportEmail(), p.getEmailFromAddress());
    }
}
