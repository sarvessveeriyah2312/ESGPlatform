package com.esgeasy.esg.tenant.dto;

/** Partner console Security settings — deliberately separate from PlatformSettingsResponse.require2fa, which is platform-wide and platform-admin-only. See Partner.mfaRequiredForTeam. */
public record PartnerSecuritySettingsResponse(boolean mfaRequiredForTeam) {
}
