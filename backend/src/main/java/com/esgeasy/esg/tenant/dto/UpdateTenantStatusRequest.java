package com.lestari.esg.tenant.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateTenantStatusRequest(@NotNull Boolean active) {
}
