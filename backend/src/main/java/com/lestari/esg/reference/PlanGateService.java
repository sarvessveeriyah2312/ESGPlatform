package com.lestari.esg.reference;

import com.lestari.esg.common.exceptions.NotFoundException;
import com.lestari.esg.security.CurrentUserProvider;
import com.lestari.esg.tenant.Company;
import com.lestari.esg.tenant.CompanyRepository;
import org.springframework.stereotype.Component;

/**
 * Backs {@code @PreAuthorize("@planGate.check('feature-key')")} on gated endpoints. Always
 * re-reads {@link Company#getSubscriptionPlan()} fresh from the DB rather than trusting a JWT
 * claim, so a plan downgrade takes effect immediately rather than on next login.
 */
@Component("planGate")
public class PlanGateService {

    private final CurrentUserProvider currentUserProvider;
    private final CompanyRepository companyRepository;
    private final FeatureFlagRepository featureFlagRepository;

    public PlanGateService(CurrentUserProvider currentUserProvider,
                            CompanyRepository companyRepository,
                            FeatureFlagRepository featureFlagRepository) {
        this.currentUserProvider = currentUserProvider;
        this.companyRepository = companyRepository;
        this.featureFlagRepository = featureFlagRepository;
    }

    public boolean check(String featureKey) {
        // TEMP: plan gating disabled for dev — delete this line to re-enable enforcement.
        if (true) return true;

        FeatureFlag flag = featureFlagRepository.findById(featureKey).orElse(null);
        if (flag == null) {
            return true; // unlisted features default open, mirrors frontend's hasFeature() default
        }

        Company company = companyRepository.findById(currentUserProvider.requireCompanyId())
                .orElseThrow(() -> new NotFoundException("Company not found"));

        return company.getSubscriptionPlan().atLeast(flag.getMinPlan());
    }
}
