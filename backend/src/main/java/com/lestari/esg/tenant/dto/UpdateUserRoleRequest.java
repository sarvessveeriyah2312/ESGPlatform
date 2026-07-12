package com.lestari.esg.tenant.dto;

import com.lestari.esg.user.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(
        @NotNull Role role
) {
}
