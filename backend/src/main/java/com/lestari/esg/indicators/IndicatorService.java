package com.lestari.esg.indicators;

import com.lestari.esg.common.exceptions.ConflictException;
import com.lestari.esg.common.exceptions.NotFoundException;
import com.lestari.esg.indicators.dto.AuditEntryDto;
import com.lestari.esg.indicators.dto.IndicatorResponse;
import com.lestari.esg.indicators.dto.IndicatorValuePointDto;
import com.lestari.esg.indicators.dto.SetIndicatorTargetRequest;
import com.lestari.esg.indicators.dto.SetIndicatorValueRequest;
import com.lestari.esg.reference.IndicatorDefinition;
import com.lestari.esg.reference.IndicatorDefinitionRepository;
import com.lestari.esg.reference.MatterSetResolverService;
import com.lestari.esg.reference.SustainabilityMatter;
import com.lestari.esg.security.CurrentUserProvider;
import com.lestari.esg.tenant.Company;
import com.lestari.esg.tenant.CompanyRepository;
import com.lestari.esg.user.AppUser;
import com.lestari.esg.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IndicatorService {

    private final IndicatorDefinitionRepository indicatorDefinitionRepository;
    private final TenantIndicatorRepository tenantIndicatorRepository;
    private final IndicatorValueRepository indicatorValueRepository;
    private final IndicatorAuditEntryRepository auditEntryRepository;
    private final MatterSetResolverService matterSetResolverService;
    private final CurrentUserProvider currentUserProvider;
    private final CompanyRepository companyRepository;
    private final AppUserRepository appUserRepository;

    public IndicatorService(IndicatorDefinitionRepository indicatorDefinitionRepository,
                             TenantIndicatorRepository tenantIndicatorRepository,
                             IndicatorValueRepository indicatorValueRepository,
                             IndicatorAuditEntryRepository auditEntryRepository,
                             MatterSetResolverService matterSetResolverService,
                             CurrentUserProvider currentUserProvider,
                             CompanyRepository companyRepository,
                             AppUserRepository appUserRepository) {
        this.indicatorDefinitionRepository = indicatorDefinitionRepository;
        this.tenantIndicatorRepository = tenantIndicatorRepository;
        this.indicatorValueRepository = indicatorValueRepository;
        this.auditEntryRepository = auditEntryRepository;
        this.matterSetResolverService = matterSetResolverService;
        this.currentUserProvider = currentUserProvider;
        this.companyRepository = companyRepository;
        this.appUserRepository = appUserRepository;
    }

    @Transactional(readOnly = true)
    public List<IndicatorResponse> listIndicators() {
        UUID companyId = currentUserProvider.requireCompanyId();
        Company company = companyRepository.findById(companyId).orElseThrow(() -> new NotFoundException("Company not found"));

        List<String> matterIds = matterSetResolverService.resolveApplicableMatters(company).stream()
                .map(SustainabilityMatter::getId)
                .toList();
        List<IndicatorDefinition> defs = indicatorDefinitionRepository.findByMatterIdIn(matterIds);
        List<String> defIds = defs.stream().map(IndicatorDefinition::getId).toList();

        Map<String, TenantIndicator> overrides = tenantIndicatorRepository
                .findByCompanyIdAndIndicatorDefinitionIdIn(companyId, defIds).stream()
                .collect(Collectors.toMap(ti -> ti.getIndicatorDefinition().getId(), ti -> ti));

        Map<String, List<IndicatorValue>> valuesByDef = indicatorValueRepository
                .findByCompanyIdAndIndicatorDefinitionIdIn(companyId, defIds).stream()
                .collect(Collectors.groupingBy(v -> v.getIndicatorDefinition().getId()));

        Map<String, List<IndicatorAuditEntry>> historyByDef = auditEntryRepository
                .findByCompanyIdAndIndicatorDefinitionIdInOrderByCreatedAtDesc(companyId, defIds).stream()
                .collect(Collectors.groupingBy(a -> a.getIndicatorDefinition().getId()));

        return defs.stream()
                .map(def -> toResponse(def, overrides.get(def.getId()), valuesByDef.getOrDefault(def.getId(), List.of()), historyByDef.getOrDefault(def.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public IndicatorResponse getIndicator(String indicatorDefinitionId) {
        UUID companyId = currentUserProvider.requireCompanyId();
        IndicatorDefinition def = requireDefinition(indicatorDefinitionId);

        TenantIndicator override = tenantIndicatorRepository
                .findByCompanyIdAndIndicatorDefinitionId(companyId, indicatorDefinitionId).orElse(null);
        List<IndicatorValue> values = indicatorValueRepository.findByCompanyIdAndIndicatorDefinitionId(companyId, indicatorDefinitionId);
        List<IndicatorAuditEntry> history = auditEntryRepository.findByCompanyIdAndIndicatorDefinitionIdOrderByCreatedAtDesc(companyId, indicatorDefinitionId);

        return toResponse(def, override, values, history);
    }

    @Transactional
    public IndicatorResponse setValue(String indicatorDefinitionId, int fiscalYear, SetIndicatorValueRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        IndicatorDefinition def = requireDefinition(indicatorDefinitionId);
        AppUser user = appUserRepository.findById(currentUserProvider.getPrincipal().userId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        IndicatorValue value = indicatorValueRepository
                .findByCompanyIdAndIndicatorDefinitionIdAndFiscalYear(companyId, indicatorDefinitionId, fiscalYear)
                .orElseGet(() -> {
                    IndicatorValue v = new IndicatorValue();
                    v.setCompanyId(companyId);
                    v.setIndicatorDefinition(def);
                    v.setFiscalYear(fiscalYear);
                    return v;
                });
        value.setValue(request.value());
        // Any edit invalidates a prior approval — the figure needs re-approval by a Company Admin.
        value.setStatus(IndicatorValueStatus.DRAFT);
        value.setApprovedByName(null);
        value.setApprovedAt(null);
        indicatorValueRepository.save(value);

        IndicatorAuditEntry entry = new IndicatorAuditEntry();
        entry.setCompanyId(companyId);
        entry.setIndicatorDefinition(def);
        entry.setFiscalYear(fiscalYear);
        entry.setValue(request.value());
        entry.setEnteredBy(user.getName());
        entry.setSourceDocName(request.sourceDocName());
        entry.setComment(request.comment());
        auditEntryRepository.save(entry);

        return getIndicator(indicatorDefinitionId);
    }

    @Transactional
    public IndicatorResponse setTarget(String indicatorDefinitionId, SetIndicatorTargetRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        IndicatorDefinition def = requireDefinition(indicatorDefinitionId);

        TenantIndicator override = tenantIndicatorRepository
                .findByCompanyIdAndIndicatorDefinitionId(companyId, indicatorDefinitionId)
                .orElseGet(() -> {
                    TenantIndicator ti = new TenantIndicator();
                    ti.setCompanyId(companyId);
                    ti.setIndicatorDefinition(def);
                    return ti;
                });
        override.setTarget(request.target());
        override.setTargetDirection(request.targetDirection());
        tenantIndicatorRepository.save(override);

        return getIndicator(indicatorDefinitionId);
    }

    /** Board/management sign-off on a reported figure — mirrors materiality's Draft/Validated pattern. */
    @Transactional
    public IndicatorResponse approveValue(String indicatorDefinitionId, int fiscalYear) {
        UUID companyId = currentUserProvider.requireCompanyId();
        IndicatorValue value = indicatorValueRepository
                .findByCompanyIdAndIndicatorDefinitionIdAndFiscalYear(companyId, indicatorDefinitionId, fiscalYear)
                .orElseThrow(() -> new NotFoundException("No value recorded for this indicator and fiscal year"));
        if (value.getStatus() == IndicatorValueStatus.APPROVED) {
            throw new ConflictException("This value has already been approved");
        }

        AppUser user = appUserRepository.findById(currentUserProvider.getPrincipal().userId())
                .orElseThrow(() -> new NotFoundException("User not found"));

        value.setStatus(IndicatorValueStatus.APPROVED);
        value.setApprovedByName(user.getName());
        value.setApprovedAt(Instant.now());
        indicatorValueRepository.save(value);

        return getIndicator(indicatorDefinitionId);
    }

    private IndicatorDefinition requireDefinition(String id) {
        return indicatorDefinitionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Unknown indicator id: " + id));
    }

    private IndicatorResponse toResponse(IndicatorDefinition def, TenantIndicator override, List<IndicatorValue> values, List<IndicatorAuditEntry> history) {
        var effectiveTarget = override != null && override.getTarget() != null ? override.getTarget() : def.getDefaultTarget();
        var effectiveDirection = override != null && override.getTargetDirection() != null ? override.getTargetDirection() : def.getDefaultTargetDirection();
        boolean enabled = override == null || Boolean.TRUE.equals(override.getEnabled());

        return new IndicatorResponse(
                def.getId(),
                def.getName(),
                def.getUnit(),
                def.getMatter().getId(),
                def.getCategory(),
                Boolean.TRUE.equals(def.getSectorSpecific()),
                def.getSector() != null ? def.getSector().getCode() : null,
                effectiveTarget,
                effectiveDirection,
                enabled,
                values.stream().map(v -> new IndicatorValuePointDto(v.getFiscalYear(), v.getValue(), v.getStatus(), v.getApprovedByName(), v.getApprovedAt())).toList(),
                history.stream().map(AuditEntryDto::from).toList()
        );
    }
}
