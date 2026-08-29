package com.esgeasy.esg.tenant.dto;

import java.util.UUID;

/** Links (or unlinks, when partnerId is null) a company to a partner — see CompanyService.adminUpdatePartner. */
public record UpdateTenantPartnerRequest(UUID partnerId) {
}
