package com.lestari.esg.tenant.dto;

import com.lestari.esg.user.Role;

import java.time.Instant;
import java.util.UUID;

public record TenantUserResponse(
        UUID id,
        String name,
        String email,
        Role role,
        boolean active,
        Instant createdAt
) {
}
