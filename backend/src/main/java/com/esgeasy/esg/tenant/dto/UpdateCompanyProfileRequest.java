package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.tenant.CompanySizeBand;

public record UpdateCompanyProfileRequest(
        String sectorCode,
        CompanySizeBand sizeBand,
        Boolean sectorModuleEnabled
) {
}
