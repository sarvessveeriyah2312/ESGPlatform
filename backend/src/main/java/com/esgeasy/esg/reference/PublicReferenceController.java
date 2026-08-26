package com.esgeasy.esg.reference;

import com.esgeasy.esg.reference.dto.FeatureFlagResponse;
import com.esgeasy.esg.tenant.dto.PlanPricingResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Unauthenticated read-only data for the public marketing site (landing/pricing pages — see
 * SecurityConfig's permitAll for {@code /api/v1/public/**}). Reuses the exact same admin-managed
 * pricing (plan_pricing) and feature-gating (feature_flag) data the app itself runs on, via
 * {@link ReferenceService}, so the pricing page can never silently drift from reality the way a
 * hardcoded copy could.
 */
@RestController
@RequestMapping("/api/v1/public")
public class PublicReferenceController {

    private final ReferenceService referenceService;

    public PublicReferenceController(ReferenceService referenceService) {
        this.referenceService = referenceService;
    }

    @GetMapping("/plan-pricing")
    public List<PlanPricingResponse> planPricing() {
        return referenceService.listPlanPricing();
    }

    @GetMapping("/features")
    public List<FeatureFlagResponse> features() {
        return referenceService.listFeatureFlags();
    }
}
