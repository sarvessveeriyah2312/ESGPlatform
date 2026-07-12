package com.lestari.esg.climate.dto;

import java.util.List;
import java.util.UUID;

public record Scope3CategoryResponse(
        UUID id,
        String name,
        String tooltip,
        List<Scope3ValuePointDto> values
) {
}
