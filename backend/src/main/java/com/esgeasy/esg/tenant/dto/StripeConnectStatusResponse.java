package com.esgeasy.esg.tenant.dto;

/**
 * Live status of a partner's Stripe connected account — {@code connected} is false until a partner
 * has started onboarding at all (no account id yet); once an account exists, {@code chargesEnabled}
 * reflects whether Stripe has actually approved it to receive destination-charge transfers. See
 * PartnerService.getStripeConnectStatus.
 */
public record StripeConnectStatusResponse(
        boolean connected,
        String stripeAccountId,
        boolean chargesEnabled,
        boolean payoutsEnabled,
        boolean detailsSubmitted
) {
    public static StripeConnectStatusResponse notConnected() {
        return new StripeConnectStatusResponse(false, null, false, false, false);
    }
}
