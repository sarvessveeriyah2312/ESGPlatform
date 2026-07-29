package com.esgeasy.esg.governance;

import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.governance.dto.GovernanceLevelResponse;
import com.esgeasy.esg.governance.dto.MatterOwnershipResponse;
import com.esgeasy.esg.governance.dto.UpdateGovernanceLevelRequest;
import com.esgeasy.esg.governance.dto.UpdateMatterOwnershipRequest;
import com.esgeasy.esg.reference.MatterSetResolverService;
import com.esgeasy.esg.reference.SustainabilityMatter;
import com.esgeasy.esg.reference.SustainabilityMatterCategory;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class GovernanceService {

    private static final Map<OversightLevel, String[]> DEFAULT_LEVELS = Map.of(
            OversightLevel.OVERSIGHT, new String[]{
                    "Board Sustainability Committee",
                    "Provides governance oversight of corporate ESG alignment, approves ESG reporting baselines, monitors climate physical/transition risks twice annually, and steers strategic compliance benchmarks."
            },
            OversightLevel.STRATEGIC, new String[]{
                    "Chief Sustainability Officer",
                    "Chairs the executive ESG committee, translates board directives into operational guidelines, prioritizes budgetary allocations for decarbonization projects, and reviews policy disclosures."
            },
            OversightLevel.IMPLEMENTATION, new String[]{
                    "ESG Working Group Leads",
                    "Maintains operational spreadsheets, gathers monthly utility invoice logs, measures water footprints, inspects waste logs, and maintains the primary ESG inventory database."
            }
    );

    private final GovernanceLevelRepository levelRepository;
    private final MatterOwnershipRepository ownershipRepository;
    private final MatterSetResolverService matterSetResolverService;
    private final CurrentUserProvider currentUserProvider;
    private final CompanyRepository companyRepository;

    public GovernanceService(GovernanceLevelRepository levelRepository,
                              MatterOwnershipRepository ownershipRepository,
                              MatterSetResolverService matterSetResolverService,
                              CurrentUserProvider currentUserProvider,
                              CompanyRepository companyRepository) {
        this.levelRepository = levelRepository;
        this.ownershipRepository = ownershipRepository;
        this.matterSetResolverService = matterSetResolverService;
        this.currentUserProvider = currentUserProvider;
        this.companyRepository = companyRepository;
    }

    @Transactional
    public List<GovernanceLevelResponse> getStructure() {
        UUID companyId = currentUserProvider.requireCompanyId();
        List<GovernanceLevel> levels = levelRepository.findByCompanyId(companyId);
        if (levels.isEmpty()) {
            for (var entry : DEFAULT_LEVELS.entrySet()) {
                GovernanceLevel level = new GovernanceLevel();
                level.setCompanyId(companyId);
                level.setLevel(entry.getKey());
                level.setRoleTitle(entry.getValue()[0]);
                level.setDescription(entry.getValue()[1]);
                levelRepository.save(level);
            }
            levels = levelRepository.findByCompanyId(companyId);
        }
        return levels.stream().map(GovernanceLevelResponse::from).toList();
    }

    @Transactional
    public GovernanceLevelResponse updateLevel(OversightLevel level, UpdateGovernanceLevelRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        GovernanceLevel entity = levelRepository.findByCompanyIdAndLevel(companyId, level)
                .orElseGet(() -> {
                    GovernanceLevel l = new GovernanceLevel();
                    l.setCompanyId(companyId);
                    l.setLevel(level);
                    return l;
                });
        entity.setRoleTitle(request.roleTitle());
        entity.setDescription(request.description());
        return GovernanceLevelResponse.from(levelRepository.save(entity));
    }

    @Transactional
    public List<MatterOwnershipResponse> getOwnership() {
        UUID companyId = currentUserProvider.requireCompanyId();
        Company company = companyRepository.findById(companyId).orElseThrow(() -> new NotFoundException("Company not found"));
        List<SustainabilityMatter> applicableMatters = matterSetResolverService.resolveApplicableMatters(company);

        for (SustainabilityMatter matter : applicableMatters) {
            if (ownershipRepository.findByCompanyIdAndMatterId(companyId, matter.getId()).isEmpty()) {
                MatterOwnership ownership = new MatterOwnership();
                ownership.setCompanyId(companyId);
                ownership.setMatter(matter);
                ownership.setOversightLevel(defaultLevelFor(matter.getCategory()));
                ownership.setOwnerName("");
                ownership.setNotes("Standard policy baseline tracking");
                ownershipRepository.save(ownership);
            }
        }

        return ownershipRepository.findByCompanyId(companyId).stream()
                .map(MatterOwnershipResponse::from)
                .toList();
    }

    @Transactional
    public MatterOwnershipResponse updateOwnership(String matterId, UpdateMatterOwnershipRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        MatterOwnership ownership = ownershipRepository.findByCompanyIdAndMatterId(companyId, matterId)
                .orElseThrow(() -> new NotFoundException("No ownership record for matter " + matterId + " — call GET /governance/ownership first"));
        ownership.setOwnerName(request.ownerName());
        ownership.setOversightLevel(request.oversightLevel());
        ownership.setNotes(request.notes());
        return MatterOwnershipResponse.from(ownershipRepository.save(ownership));
    }

    private OversightLevel defaultLevelFor(SustainabilityMatterCategory category) {
        return switch (category) {
            case ENVIRONMENTAL -> OversightLevel.IMPLEMENTATION;
            case SOCIAL -> OversightLevel.STRATEGIC;
            case GOVERNANCE -> OversightLevel.OVERSIGHT;
        };
    }

}
