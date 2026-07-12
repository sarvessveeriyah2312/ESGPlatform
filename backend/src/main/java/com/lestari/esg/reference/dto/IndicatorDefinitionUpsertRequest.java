package com.lestari.esg.reference.dto;

import com.lestari.esg.reference.SustainabilityMatterCategory;
import com.lestari.esg.reference.TargetDirection;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record IndicatorDefinitionUpsertRequest(
        @NotBlank String id,
        @NotBlank String name,
        @NotBlank String unit,
        @NotBlank String matterId,
        @NotNull SustainabilityMatterCategory category,
        boolean sectorSpecific,
        String sectorCode,
        BigDecimal defaultTarget,
        TargetDirection defaultTargetDirection
) {
}
