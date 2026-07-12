package com.lestari.esg.reference.dto;

import com.lestari.esg.tenant.Sector;

public record SectorResponse(String code, String name) {
    public static SectorResponse from(Sector s) {
        return new SectorResponse(s.getCode(), s.getName());
    }
}
