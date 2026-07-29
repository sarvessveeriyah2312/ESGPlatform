package com.esgeasy.esg.reference;

import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.permission.PermissionRepository;
import com.esgeasy.esg.permission.dto.PermissionResponse;
import com.esgeasy.esg.reference.dto.FeatureFlagResponse;
import com.esgeasy.esg.reference.dto.IndicatorDefinitionResponse;
import com.esgeasy.esg.reference.dto.IndicatorDefinitionUpsertRequest;
import com.esgeasy.esg.reference.dto.MatterResponse;
import com.esgeasy.esg.reference.dto.MatterUpsertRequest;
import com.esgeasy.esg.reference.dto.SectorResponse;
import com.esgeasy.esg.reference.dto.UpdateFeatureFlagRequest;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.CompanyRepository;
import com.esgeasy.esg.tenant.PlanPricingRepository;
import com.esgeasy.esg.tenant.Sector;
import com.esgeasy.esg.tenant.SectorRepository;
import com.esgeasy.esg.tenant.dto.PlanPricingResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReferenceService {

    private final SustainabilityMatterRepository matterRepository;
    private final IndicatorDefinitionRepository indicatorDefinitionRepository;
    private final SectorRepository sectorRepository;
    private final MatterSetResolverService matterSetResolverService;
    private final CurrentUserProvider currentUserProvider;
    private final CompanyRepository companyRepository;
    private final FeatureFlagRepository featureFlagRepository;
    private final PlanPricingRepository planPricingRepository;
    private final PermissionRepository permissionRepository;

    public ReferenceService(SustainabilityMatterRepository matterRepository,
                             IndicatorDefinitionRepository indicatorDefinitionRepository,
                             SectorRepository sectorRepository,
                             MatterSetResolverService matterSetResolverService,
                             CurrentUserProvider currentUserProvider,
                             CompanyRepository companyRepository,
                             FeatureFlagRepository featureFlagRepository,
                             PlanPricingRepository planPricingRepository,
                             PermissionRepository permissionRepository) {
        this.matterRepository = matterRepository;
        this.indicatorDefinitionRepository = indicatorDefinitionRepository;
        this.sectorRepository = sectorRepository;
        this.matterSetResolverService = matterSetResolverService;
        this.currentUserProvider = currentUserProvider;
        this.companyRepository = companyRepository;
        this.featureFlagRepository = featureFlagRepository;
        this.planPricingRepository = planPricingRepository;
        this.permissionRepository = permissionRepository;
    }

    @Transactional(readOnly = true)
    public List<SectorResponse> listSectors() {
        return sectorRepository.findAll().stream().map(SectorResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<MatterResponse> listMatters(MatterSet set) {
        List<SustainabilityMatter> matters = set != null
                ? matterRepository.findByMatterSet(set)
                : matterRepository.findAll();
        return matters.stream().map(MatterResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<MatterResponse> listApplicableMatters() {
        Company company = currentCompany();
        return matterSetResolverService.resolveApplicableMatters(company).stream()
                .map(MatterResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<IndicatorDefinitionResponse> listIndicators(String matterId) {
        List<IndicatorDefinition> defs = matterId != null
                ? indicatorDefinitionRepository.findByMatterIdIn(List.of(matterId))
                : indicatorDefinitionRepository.findAll();
        return defs.stream().map(IndicatorDefinitionResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<IndicatorDefinitionResponse> listApplicableIndicators() {
        Company company = currentCompany();
        List<String> matterIds = matterSetResolverService.resolveApplicableMatters(company).stream()
                .map(SustainabilityMatter::getId)
                .toList();
        return indicatorDefinitionRepository.findByMatterIdIn(matterIds).stream()
                .map(IndicatorDefinitionResponse::from)
                .toList();
    }

    @Transactional
    public MatterResponse upsertMatter(MatterUpsertRequest request) {
        SustainabilityMatter matter = matterRepository.findById(request.id()).orElseGet(SustainabilityMatter::new);
        matter.setId(request.id());
        matter.setName(request.name());
        matter.setCategory(request.category());
        matter.setDescription(request.description());
        matter.setMatterSet(request.matterSet());
        return MatterResponse.from(matterRepository.save(matter));
    }

    @Transactional
    public void deleteMatter(String id) {
        if (!matterRepository.existsById(id)) {
            throw new NotFoundException("Matter not found: " + id);
        }
        matterRepository.deleteById(id);
    }

    @Transactional
    public IndicatorDefinitionResponse upsertIndicator(IndicatorDefinitionUpsertRequest request) {
        SustainabilityMatter matter = matterRepository.findById(request.matterId())
                .orElseThrow(() -> new NotFoundException("Unknown matter id: " + request.matterId()));

        IndicatorDefinition def = indicatorDefinitionRepository.findById(request.id()).orElseGet(IndicatorDefinition::new);
        def.setId(request.id());
        def.setName(request.name());
        def.setUnit(request.unit());
        def.setMatter(matter);
        def.setCategory(request.category());
        def.setSectorSpecific(request.sectorSpecific());
        def.setDefaultTarget(request.defaultTarget());
        def.setDefaultTargetDirection(request.defaultTargetDirection());
        def.setAggregationRule(request.aggregationRule());

        if (request.sectorCode() != null && !request.sectorCode().isBlank()) {
            Sector sector = sectorRepository.findById(request.sectorCode())
                    .orElseThrow(() -> new NotFoundException("Unknown sector code: " + request.sectorCode()));
            def.setSector(sector);
        } else {
            def.setSector(null);
        }

        return IndicatorDefinitionResponse.from(indicatorDefinitionRepository.save(def));
    }

    @Transactional
    public void deleteIndicator(String id) {
        if (!indicatorDefinitionRepository.existsById(id)) {
            throw new NotFoundException("Indicator not found: " + id);
        }
        indicatorDefinitionRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public List<FeatureFlagResponse> listFeatureFlags() {
        return featureFlagRepository.findAll().stream().map(FeatureFlagResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PlanPricingResponse> listPlanPricing() {
        return planPricingRepository.findAll().stream().map(PlanPricingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PermissionResponse> listPermissions() {
        return permissionRepository.findAllByOrderByDisplayOrderAsc().stream().map(PermissionResponse::from).toList();
    }

    @Transactional
    public FeatureFlagResponse updateFeatureFlag(String featureKey, UpdateFeatureFlagRequest request) {
        FeatureFlag flag = featureFlagRepository.findById(featureKey)
                .orElseThrow(() -> new NotFoundException("Unknown feature key: " + featureKey));
        flag.setMinPlan(request.minPlan());
        flag.setVisibleOnlyAtMinPlan(request.visibleOnlyAtMinPlan());
        return FeatureFlagResponse.from(featureFlagRepository.save(flag));
    }

    private Company currentCompany() {
        return companyRepository.findById(currentUserProvider.requireCompanyId())
                .orElseThrow(() -> new NotFoundException("Company not found"));
    }
}
