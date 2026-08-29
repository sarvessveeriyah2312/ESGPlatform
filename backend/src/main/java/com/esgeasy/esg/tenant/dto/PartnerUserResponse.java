package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.user.AppUser;

import java.time.Instant;
import java.util.UUID;

/** A partner's own team directory — every row is PARTNER_ADMIN (no sub-roles for partner logins yet), so unlike TenantUserResponse there's no role/customRole to show. */
public record PartnerUserResponse(UUID id, String name, String email, boolean active, Instant createdAt) {
    public static PartnerUserResponse from(AppUser u) {
        return new PartnerUserResponse(u.getId(), u.getName(), u.getEmail(), Boolean.TRUE.equals(u.getActive()), u.getCreatedAt());
    }
}
