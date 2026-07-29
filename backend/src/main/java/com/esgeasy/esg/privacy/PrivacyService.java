package com.esgeasy.esg.privacy;

import com.esgeasy.esg.assurance.AssuranceService;
import com.esgeasy.esg.common.exceptions.ConflictException;
import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.governance.CompliancePolicyService;
import com.esgeasy.esg.governance.GovernanceService;
import com.esgeasy.esg.indicators.IndicatorService;
import com.esgeasy.esg.materiality.MaterialityService;
import com.esgeasy.esg.privacy.dto.CloseAccountRequest;
import com.esgeasy.esg.privacy.dto.CompanyDataExportResponse;
import com.esgeasy.esg.privacy.dto.PrivacyConsentResponse;
import com.esgeasy.esg.privacy.dto.UpdatePrivacyConsentRequest;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.session.UserSessionService;
import com.esgeasy.esg.targets.PerformanceTargetService;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.CompanyRepository;
import com.esgeasy.esg.tenant.CompanyService;
import com.esgeasy.esg.tenant.dto.CompanyResponse;
import com.esgeasy.esg.user.AppUser;
import com.esgeasy.esg.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PrivacyService {

    private final CompanyRepository companyRepository;
    private final AppUserRepository appUserRepository;
    private final CurrentUserProvider currentUserProvider;
    private final UserSessionService userSessionService;
    private final CompanyService companyService;
    private final IndicatorService indicatorService;
    private final MaterialityService materialityService;
    private final GovernanceService governanceService;
    private final CompliancePolicyService compliancePolicyService;
    private final PerformanceTargetService performanceTargetService;
    private final AssuranceService assuranceService;

    public PrivacyService(CompanyRepository companyRepository, AppUserRepository appUserRepository,
                           CurrentUserProvider currentUserProvider, UserSessionService userSessionService,
                           CompanyService companyService, IndicatorService indicatorService,
                           MaterialityService materialityService, GovernanceService governanceService,
                           CompliancePolicyService compliancePolicyService,
                           PerformanceTargetService performanceTargetService, AssuranceService assuranceService) {
        this.companyRepository = companyRepository;
        this.appUserRepository = appUserRepository;
        this.currentUserProvider = currentUserProvider;
        this.userSessionService = userSessionService;
        this.companyService = companyService;
        this.indicatorService = indicatorService;
        this.materialityService = materialityService;
        this.governanceService = governanceService;
        this.compliancePolicyService = compliancePolicyService;
        this.performanceTargetService = performanceTargetService;
        this.assuranceService = assuranceService;
    }

    @Transactional(readOnly = true)
    public PrivacyConsentResponse getConsent() {
        return PrivacyConsentResponse.from(currentCompany());
    }

    @Transactional
    public PrivacyConsentResponse updateConsent(UpdatePrivacyConsentRequest request) {
        Company company = currentCompany();
        company.setMarketingConsent(request.marketingConsent());
        company.setAnalyticsConsent(request.analyticsConsent());
        company.setConsentUpdatedAt(Instant.now());
        return PrivacyConsentResponse.from(companyRepository.save(company));
    }

    @Transactional(readOnly = true)
    public CompanyDataExportResponse exportData() {
        UUID companyId = currentUserProvider.requireCompanyId();
        return new CompanyDataExportResponse(
                Instant.now(),
                CompanyResponse.from(currentCompany()),
                companyService.listTenantUsers(companyId),
                indicatorService.listIndicators(),
                materialityService.listAssessments(),
                governanceService.getStructure(),
                governanceService.getOwnership(),
                compliancePolicyService.getPolicies(),
                performanceTargetService.list(),
                assuranceService.list()
        );
    }

    /** Deactivates the entire company group (this company plus every subsidiary) and every user in
     *  it, and forces an immediate logout everywhere. This does NOT physically delete any data —
     *  every company_id foreign key in this schema is ON DELETE RESTRICT by design, so a true hard
     *  delete would require unwinding ~20 tables and risks partial failure. Deactivation is safe,
     *  reversible (via platform admin), and reuses the exact active/tokenVersion checks already
     *  enforced on every request. */
    @Transactional
    public void closeAccount(CloseAccountRequest request) {
        Company root = groupRoot(currentCompany());

        if (!root.getName().equals(request.confirmCompanyName())) {
            throw new ConflictException("Company name confirmation does not match — account was not closed");
        }

        List<Company> group = new ArrayList<>();
        group.add(root);
        group.addAll(companyRepository.findByParentCompanyId(root.getId()));

        Instant now = Instant.now();
        for (Company company : group) {
            company.setActive(false);
            company.setClosedAt(now);
            companyRepository.save(company);

            for (AppUser user : appUserRepository.findByCompanyId(company.getId())) {
                user.setActive(false);
                user.setTokenVersion(user.getTokenVersion() + 1);
                appUserRepository.save(user);
                userSessionService.revokeAll(user.getId());
            }
        }
    }

    private Company currentCompany() {
        return companyRepository.findById(currentUserProvider.requireCompanyId())
                .orElseThrow(() -> new NotFoundException("Company not found"));
    }

    private Company groupRoot(Company company) {
        return company.getParentCompany() != null ? company.getParentCompany() : company;
    }
}
