package com.esgeasy.esg.tenant.dto;

/** A one-time onboarding (or re-onboarding) URL for a partner to complete their Stripe Connect setup — see PartnerService.startStripeConnectOnboarding. */
public record StripeConnectLinkResponse(String url) {
}
