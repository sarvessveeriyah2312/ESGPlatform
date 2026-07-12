package com.lestari.esg.reference.dto;

import com.lestari.esg.reference.MatterSet;
import com.lestari.esg.reference.SustainabilityMatter;
import com.lestari.esg.reference.SustainabilityMatterCategory;

public record MatterResponse(
        String id,
        String name,
        SustainabilityMatterCategory category,
        String description,
        MatterSet matterSet
) {
    public static MatterResponse from(SustainabilityMatter m) {
        return new MatterResponse(m.getId(), m.getName(), m.getCategory(), m.getDescription(), m.getMatterSet());
    }
}
