package com.lestari.esg.governance.dto;

import com.lestari.esg.governance.OversightLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateMatterOwnershipRequest(
        @NotBlank String ownerName,
        @NotNull OversightLevel oversightLevel,
        String notes
) {
}
