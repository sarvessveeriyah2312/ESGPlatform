package com.esgeasy.esg.reference.dto;

import com.esgeasy.esg.reference.MatterSet;
import com.esgeasy.esg.reference.SustainabilityMatter;
import com.esgeasy.esg.reference.SustainabilityMatterCategory;

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
