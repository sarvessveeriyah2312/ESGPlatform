package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.user.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull Role role
) {
}
