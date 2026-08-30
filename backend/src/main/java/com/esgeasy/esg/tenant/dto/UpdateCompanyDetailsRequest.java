package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.tenant.CompanyType;
import com.esgeasy.esg.tenant.ListingBoard;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

/** Full replace of a company's editable profile fields — Settings &gt; Company &gt; Company Details.
 *  Distinct from {@link UpdateCompanyProfileRequest}, which only covers sector/size/module-enable and
 *  always targets the caller's own current company; this covers the identity/classification/contact
 *  fields and can target any company in the caller's group (root or subsidiary). */
public record UpdateCompanyDetailsRequest(
        @NotBlank String name,
        String sectorCode,

        String registrationNumber,
        String tickerCode,
        LocalDate dateOfIncorporation,
        String countryOfIncorporation,

        ListingBoard listingBoard,
        CompanyType companyType,

        String registeredOfficeAddress,
        String businessAddress,
        String contactPersonName,
        String contactPersonDesignation,
        @Email String contactPersonEmail,
        String contactPersonPhone,
        String taxIdentificationNumber
) {
}
