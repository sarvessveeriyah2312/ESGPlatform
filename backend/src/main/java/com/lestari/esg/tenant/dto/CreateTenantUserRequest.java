package com.lestari.esg.tenant.dto;

import com.lestari.esg.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTenantUserRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotNull Role role
) {
}
