package com.esgeasy.esg.user;

public enum Role {
    COMPANY_ADMIN,
    COMPANY_CONTRIBUTOR,
    CONSULTANT,
    PLATFORM_ADMIN,
    SUPERADMIN,
    /** A white-label partner's own login — see Partner, AppUser.partner. */
    PARTNER_ADMIN
}
