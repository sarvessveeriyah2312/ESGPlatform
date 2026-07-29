package com.esgeasy.esg.governance.dto;

import com.esgeasy.esg.governance.OversightLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateMatterOwnershipRequest(
        @NotBlank String ownerName,
        @NotNull OversightLevel oversightLevel,
        String notes
) {
}
