package com.esgeasy.esg.privacy.dto;

import com.esgeasy.esg.assurance.dto.SignOffResponse;
import com.esgeasy.esg.governance.dto.CompliancePolicyResponse;
import com.esgeasy.esg.governance.dto.GovernanceLevelResponse;
import com.esgeasy.esg.governance.dto.MatterOwnershipResponse;
import com.esgeasy.esg.indicators.dto.IndicatorResponse;
import com.esgeasy.esg.materiality.dto.AssessmentSummaryResponse;
import com.esgeasy.esg.targets.dto.PerformanceTargetResponse;
import com.esgeasy.esg.tenant.dto.CompanyResponse;
import com.esgeasy.esg.tenant.dto.TenantUserResponse;

import java.time.Instant;
import java.util.List;

/** A bulk, self-service export of everything an ESG dashboard stores against the requesting
 *  company — company profile, team, indicators, materiality, governance, compliance, targets and
 *  sign-off history. Returned as JSON; the frontend triggers a browser download of it directly. */
public record CompanyDataExportResponse(
        Instant exportedAt,
        CompanyResponse company,
        List<TenantUserResponse> teamMembers,
        List<IndicatorResponse> indicators,
        List<AssessmentSummaryResponse> materialityAssessments,
        List<GovernanceLevelResponse> governanceStructure,
        List<MatterOwnershipResponse> governanceOwnership,
        List<CompliancePolicyResponse> compliancePolicies,
        List<PerformanceTargetResponse> targets,
        List<SignOffResponse> signOffRecords
) {
}
