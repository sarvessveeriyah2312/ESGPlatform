package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.user.AppUser;

import java.time.Instant;
import java.util.UUID;

/** Mirrors CreateTenantUserResponse's pattern — the temporary password is returned once, at creation time, never stored or retrievable again. */
public record CreatePartnerAdminUserResponse(UUID id, String name, String email, boolean active, Instant createdAt, String temporaryPassword) {
    public static CreatePartnerAdminUserResponse from(AppUser u, String temporaryPassword) {
        return new CreatePartnerAdminUserResponse(u.getId(), u.getName(), u.getEmail(), Boolean.TRUE.equals(u.getActive()), u.getCreatedAt(), temporaryPassword);
    }
}
