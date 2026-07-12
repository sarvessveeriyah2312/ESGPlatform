package com.lestari.esg.tenant.dto;

import com.lestari.esg.tenant.CompanySizeBand;

public record UpdateCompanyProfileRequest(
        String sectorCode,
        CompanySizeBand sizeBand,
        Boolean sectorModuleEnabled
) {
}
