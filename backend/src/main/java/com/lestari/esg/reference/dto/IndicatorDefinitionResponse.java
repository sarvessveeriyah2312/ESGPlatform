package com.lestari.esg.reference.dto;

import com.lestari.esg.reference.IndicatorDefinition;
import com.lestari.esg.reference.SustainabilityMatterCategory;
import com.lestari.esg.reference.TargetDirection;

import java.math.BigDecimal;

public record IndicatorDefinitionResponse(
        String id,
        String name,
        String unit,
        String matterId,
        SustainabilityMatterCategory category,
        boolean sectorSpecific,
        String sectorCode,
        BigDecimal defaultTarget,
        TargetDirection defaultTargetDirection
) {
    public static IndicatorDefinitionResponse from(IndicatorDefinition d) {
        return new IndicatorDefinitionResponse(
                d.getId(),
                d.getName(),
                d.getUnit(),
                d.getMatter().getId(),
                d.getCategory(),
                Boolean.TRUE.equals(d.getSectorSpecific()),
                d.getSector() != null ? d.getSector().getCode() : null,
                d.getDefaultTarget(),
                d.getDefaultTargetDirection()
        );
    }
}
