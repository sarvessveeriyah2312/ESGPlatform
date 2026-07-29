package com.esgeasy.esg.reference.dto;

import com.esgeasy.esg.tenant.Sector;

public record SectorResponse(String code, String name) {
    public static SectorResponse from(Sector s) {
        return new SectorResponse(s.getCode(), s.getName());
    }
}
