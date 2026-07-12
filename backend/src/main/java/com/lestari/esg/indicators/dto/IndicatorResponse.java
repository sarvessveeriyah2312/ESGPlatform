package com.lestari.esg.indicators.dto;

import com.lestari.esg.reference.SustainabilityMatterCategory;
import com.lestari.esg.reference.TargetDirection;

import java.math.BigDecimal;
import java.util.List;

public record IndicatorResponse(
        String id,
        String name,
        String unit,
        String matterId,
        SustainabilityMatterCategory category,
        boolean sectorSpecific,
        String sectorCode,
        BigDecimal effectiveTarget,
        TargetDirection effectiveTargetDirection,
        boolean enabled,
        List<IndicatorValuePointDto> values,
        List<AuditEntryDto> history
) {
}
