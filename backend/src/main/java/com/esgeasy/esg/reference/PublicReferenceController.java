package com.esgeasy.esg.reference;

import com.esgeasy.esg.reference.dto.FeatureFlagResponse;
import com.esgeasy.esg.reference.dto.PublicBrandResponse;
import com.esgeasy.esg.tenant.Partner;
import com.esgeasy.esg.tenant.PartnerRepository;
import com.esgeasy.esg.tenant.dto.PlanPricingResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    private final PartnerRepository partnerRepository;

    public PublicReferenceController(ReferenceService referenceService, PartnerRepository partnerRepository) {
        this.referenceService = referenceService;
        this.partnerRepository = partnerRepository;
    }

    @GetMapping("/plan-pricing")
    public List<PlanPricingResponse> planPricing() {
        return referenceService.listPlanPricing();
    }

    @GetMapping("/features")
    public List<FeatureFlagResponse> features() {
        return referenceService.listFeatureFlags();
    }

    /**
     * Pre-login brand resolution for a partner's subdomain (WHITELABEL_PLAN.md Phase 3). Takes an
     * already-extracted slug rather than reading the request's own Host header, since the frontend
     * (window.location.hostname) and this API commonly run on different origins/ports — the
     * frontend is in the better position to know which hostname its visitor is actually on. A
     * same-origin deployment (e.g. the on-prem nginx bundle) could equally derive this slug from
     * the Host header upstream, but explicit-param keeps this endpoint topology-agnostic.
     */
    @GetMapping("/brand")
    public PublicBrandResponse brand(@RequestParam(required = false) String subdomain) {
        if (subdomain == null || subdomain.isBlank()) {
            return PublicBrandResponse.ESGEASY_DEFAULT;
        }
        return partnerRepository.findBySubdomainSlug(subdomain)
                .map(this::toBrandResponse)
                .orElse(PublicBrandResponse.ESGEASY_DEFAULT);
    }

    private PublicBrandResponse toBrandResponse(Partner p) {
        return new PublicBrandResponse(p.getBrandName(), p.getLogoAsset(), p.getPrimaryColor());
    }
}
