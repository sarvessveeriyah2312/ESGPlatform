package com.lestari.esg.climate;

import com.lestari.esg.climate.dto.BusinessSegmentResponse;
import com.lestari.esg.climate.dto.CreateSegmentRequest;
import com.lestari.esg.climate.dto.IfrsS2Response;
import com.lestari.esg.climate.dto.S1ItemResponse;
import com.lestari.esg.climate.dto.UpdateIfrsS2Request;
import com.lestari.esg.climate.dto.UpsertS1ItemRequest;
import com.lestari.esg.common.exceptions.ConflictException;
import com.lestari.esg.common.exceptions.NotFoundException;
import com.lestari.esg.security.CurrentUserProvider;
import com.lestari.esg.targets.PerformanceTarget;
import com.lestari.esg.targets.PerformanceTargetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class IfrsService {

    private static final String[] DEFAULT_SEGMENTS = {
            "Manufacturing Division", "Logistics & Supply", "Retail Outlets", "Agri-Processing Hub"
    };

    private final BusinessSegmentRepository segmentRepository;
    private final S1RiskOpportunityRepository itemRepository;
    private final IfrsS2DisclosureRepository s2Repository;
    private final PerformanceTargetRepository performanceTargetRepository;
    private final CurrentUserProvider currentUserProvider;

    public IfrsService(BusinessSegmentRepository segmentRepository,
                        S1RiskOpportunityRepository itemRepository,
                        IfrsS2DisclosureRepository s2Repository,
                        PerformanceTargetRepository performanceTargetRepository,
                        CurrentUserProvider currentUserProvider) {
        this.segmentRepository = segmentRepository;
        this.itemRepository = itemRepository;
        this.s2Repository = s2Repository;
        this.performanceTargetRepository = performanceTargetRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional
    public List<BusinessSegmentResponse> listSegments() {
        UUID companyId = currentUserProvider.requireCompanyId();
        if (!segmentRepository.existsByCompanyId(companyId)) {
            seedDefaultSegments(companyId);
        }
        return segmentRepository.findByCompanyId(companyId).stream()
                .map(segment -> BusinessSegmentResponse.from(segment,
                        itemRepository.findBySegmentId(segment.getId()).stream().map(S1ItemResponse::from).toList()))
                .toList();
    }

    private void seedDefaultSegments(UUID companyId) {
        for (String name : DEFAULT_SEGMENTS) {
            BusinessSegment segment = new BusinessSegment();
            segment.setCompanyId(companyId);
            segment.setName(name);
            segmentRepository.save(segment);

            if (name.equals("Manufacturing Division")) {
                addSeedItem(companyId, segment, "Carbon Tax Introduction in Malaysia", RiskOpportunityType.RISK,
                        "Potential carbon pricing mechanism increasing operating costs for high-emission facilities.",
                        TimeHorizon.MEDIUM, new BigDecimal("450000"), Currency.MYR);
                addSeedItem(companyId, segment, "Solar Rooftop Installation and RE generation", RiskOpportunityType.OPPORTUNITY,
                        "On-site renewable generation reducing grid dependency and energy costs.",
                        TimeHorizon.SHORT, new BigDecimal("180000"), Currency.MYR);
            } else if (name.equals("Logistics & Supply")) {
                addSeedItem(companyId, segment, "Transition to Electric Delivery Fleet", RiskOpportunityType.OPPORTUNITY,
                        "Fleet electrification reducing Scope 1 fuel emissions and long-run fuel costs.",
                        TimeHorizon.MEDIUM, new BigDecimal("350000"), Currency.MYR);
            }
        }
    }

    private void addSeedItem(UUID companyId, BusinessSegment segment, String title, RiskOpportunityType type,
                              String description, TimeHorizon horizon, BigDecimal financialImpact, Currency currency) {
        S1RiskOpportunity item = new S1RiskOpportunity();
        item.setCompanyId(companyId);
        item.setSegment(segment);
        item.setTitle(title);
        item.setType(type);
        item.setDescription(description);
        item.setHorizon(horizon);
        item.setFinancialImpact(financialImpact);
        item.setCurrency(currency);
        itemRepository.save(item);
    }

    @Transactional
    public BusinessSegmentResponse createSegment(CreateSegmentRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        if (segmentRepository.existsByCompanyIdAndNameIgnoreCase(companyId, request.name())) {
            throw new ConflictException("A segment with this name already exists");
        }
        BusinessSegment segment = new BusinessSegment();
        segment.setCompanyId(companyId);
        segment.setName(request.name());
        segment = segmentRepository.save(segment);
        return BusinessSegmentResponse.from(segment, List.of());
    }

    @Transactional
    public S1ItemResponse addItem(UUID segmentId, UpsertS1ItemRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        BusinessSegment segment = segmentRepository.findByIdAndCompanyId(segmentId, companyId)
                .orElseThrow(() -> new NotFoundException("Segment not found"));

        S1RiskOpportunity item = new S1RiskOpportunity();
        item.setCompanyId(companyId);
        item.setSegment(segment);
        applyItem(item, request);
        return S1ItemResponse.from(itemRepository.save(item));
    }

    @Transactional
    public S1ItemResponse updateItem(UUID itemId, UpsertS1ItemRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        S1RiskOpportunity item = itemRepository.findByIdAndCompanyId(itemId, companyId)
                .orElseThrow(() -> new NotFoundException("Item not found"));
        applyItem(item, request);
        return S1ItemResponse.from(itemRepository.save(item));
    }

    @Transactional
    public void deleteItem(UUID itemId) {
        UUID companyId = currentUserProvider.requireCompanyId();
        S1RiskOpportunity item = itemRepository.findByIdAndCompanyId(itemId, companyId)
                .orElseThrow(() -> new NotFoundException("Item not found"));
        itemRepository.delete(item);
    }

    private void applyItem(S1RiskOpportunity item, UpsertS1ItemRequest request) {
        item.setTitle(request.title());
        item.setType(request.type());
        item.setDescription(request.description());
        item.setHorizon(request.horizon());
        item.setFinancialImpact(request.financialImpact());
        item.setCurrency(request.currency());
    }

    @Transactional
    public IfrsS2Response getS2() {
        UUID companyId = currentUserProvider.requireCompanyId();
        IfrsS2Disclosure disclosure = s2Repository.findByCompanyId(companyId).orElseGet(() -> seedDefaultS2(companyId));
        return IfrsS2Response.from(disclosure);
    }

    private IfrsS2Disclosure seedDefaultS2(UUID companyId) {
        IfrsS2Disclosure d = new IfrsS2Disclosure();
        d.setCompanyId(companyId);
        d.setOversightDescription("The Board Sustainability Committee maintains ultimate governance oversight over climate physical and transition risks. This committee meets at fixed cycles to evaluate carbon mitigation projects and reviews progress against Net Zero commitments.");
        d.setReviewFrequency(ReviewFrequency.QUARTERLY);
        d.setResponsibleCommittee("Chief Sustainability Officer and Executive Committee");
        d.setPhysicalRisks("Identified chronic flood risks at Penang processing factories and coastal logistics hubs. Extreme monsoon events could disrupt raw material supplies by up to 14 days.");
        d.setTransitionPlan("Formulated a comprehensive transition pathway to decrease carbon intensity by 45% by 2030, through procurement of Green Electricity Tariffs (GET) and electrifying forklift logistics.");
        d.setClimateResilience("Currently utilizing the IPCC RCP 8.5 (high emissions) and RCP 4.5 (moderate) scenarios to conduct localized climate stress testing on assets.");
        d.setIdentificationProcess("Climate risk indicators are monitored through monthly facilities audit reports, tracking peak ambient temperatures, energy intensity spikes, and municipal water withdrawal constraints.");
        d.setIntegrationLevel(IntegrationLevel.PARTIALLY_INTEGRATED);
        d.setTrackedMetrics("Scope 1 direct diesel liters, Scope 2 TNB grid electricity kWh, Scope 3 upstream transport ton-km and raw material supplier ESG disclosure response rates.");
        d.setReductionTargets("A commitment to reduce absolute Scope 1 and Scope 2 Greenhouse Gas emissions by 30% by FY2028 compared to our audited FY2024 baseline.");
        d.setCarbonPricing("An internal shadow carbon price of RM 35 per tonne of CO2e is integrated into all new capital expenditure assessments exceeding RM 100,000.");
        return s2Repository.save(d);
    }

    @Transactional
    public IfrsS2Response updateS2(UpdateIfrsS2Request request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        IfrsS2Disclosure disclosure = s2Repository.findByCompanyId(companyId).orElseGet(() -> {
            IfrsS2Disclosure d = new IfrsS2Disclosure();
            d.setCompanyId(companyId);
            return d;
        });
        disclosure.setOversightDescription(request.oversightDescription());
        disclosure.setReviewFrequency(request.reviewFrequency());
        disclosure.setResponsibleCommittee(request.responsibleCommittee());
        disclosure.setPhysicalRisks(request.physicalRisks());
        disclosure.setTransitionPlan(request.transitionPlan());
        disclosure.setClimateResilience(request.climateResilience());
        disclosure.setIdentificationProcess(request.identificationProcess());
        disclosure.setIntegrationLevel(request.integrationLevel());
        disclosure.setTrackedMetrics(request.trackedMetrics());
        disclosure.setReductionTargets(request.reductionTargets());
        disclosure.setCarbonPricing(request.carbonPricing());

        if (request.linkedTargetId() != null && !request.linkedTargetId().isBlank()) {
            PerformanceTarget target = performanceTargetRepository
                    .findByIdAndCompanyId(UUID.fromString(request.linkedTargetId()), companyId)
                    .orElseThrow(() -> new NotFoundException("Unknown target id: " + request.linkedTargetId()));
            disclosure.setLinkedTarget(target);
        } else {
            disclosure.setLinkedTarget(null);
        }

        return IfrsS2Response.from(s2Repository.save(disclosure));
    }
}
