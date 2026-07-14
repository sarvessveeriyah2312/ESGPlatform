package com.lestari.esg.climate;

import com.lestari.esg.climate.dto.CreateScope3CategoryRequest;
import com.lestari.esg.climate.dto.EmissionPointDto;
import com.lestari.esg.climate.dto.EmissionsResponse;
import com.lestari.esg.climate.dto.Scope3CategoryResponse;
import com.lestari.esg.climate.dto.Scope3ValuePointDto;
import com.lestari.esg.climate.dto.SetEmissionValueRequest;
import com.lestari.esg.common.exceptions.NotFoundException;
import com.lestari.esg.reference.TransitionReliefRuleRepository;
import com.lestari.esg.security.CurrentUserProvider;
import com.lestari.esg.tenant.Company;
import com.lestari.esg.tenant.CompanyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;
import java.util.UUID;

@Service
public class EmissionsService {

    private final EmissionValueRepository emissionValueRepository;
    private final Scope3CategoryRepository scope3CategoryRepository;
    private final Scope3ValueRepository scope3ValueRepository;
    private final TransitionReliefRuleRepository transitionReliefRuleRepository;
    private final CurrentUserProvider currentUserProvider;
    private final CompanyRepository companyRepository;

    public EmissionsService(EmissionValueRepository emissionValueRepository,
                             Scope3CategoryRepository scope3CategoryRepository,
                             Scope3ValueRepository scope3ValueRepository,
                             TransitionReliefRuleRepository transitionReliefRuleRepository,
                             CurrentUserProvider currentUserProvider,
                             CompanyRepository companyRepository) {
        this.emissionValueRepository = emissionValueRepository;
        this.scope3CategoryRepository = scope3CategoryRepository;
        this.scope3ValueRepository = scope3ValueRepository;
        this.transitionReliefRuleRepository = transitionReliefRuleRepository;
        this.currentUserProvider = currentUserProvider;
        this.companyRepository = companyRepository;
    }

    @Transactional(readOnly = true)
    public EmissionsResponse getEmissions() {
        UUID companyId = currentUserProvider.requireCompanyId();
        Company company = companyRepository.findById(companyId).orElseThrow(() -> new NotFoundException("Company not found"));

        List<EmissionPointDto> scope1 = emissionValueRepository.findByCompanyIdAndScope(companyId, EmissionScope.SCOPE_1).stream()
                .map(v -> new EmissionPointDto(v.getFiscalYear(), v.getValue())).toList();
        List<EmissionPointDto> scope2 = emissionValueRepository.findByCompanyIdAndScope(companyId, EmissionScope.SCOPE_2).stream()
                .map(v -> new EmissionPointDto(v.getFiscalYear(), v.getValue())).toList();

        List<Scope3Category> categories = scope3CategoryRepository.findByCompanyId(companyId);
        int reliefYears = transitionReliefRuleRepository.findById(company.getMarketClassification())
                .map(r -> r.getReliefYears()).orElse(0);
        Integer firstReportingYear = scope3ValueRepository.findByCompanyId(companyId).stream()
                .map(Scope3Value::getFiscalYear)
                .min(Integer::compareTo)
                .orElse(Year.now().getValue());

        List<Scope3CategoryResponse> scope3 = categories.stream()
                .map(cat -> {
                    List<Scope3ValuePointDto> values = scope3ValueRepository.findByCategoryId(cat.getId()).stream()
                            .map(v -> new Scope3ValuePointDto(v.getFiscalYear(), v.getValue(), isInRelief(v.getFiscalYear(), firstReportingYear, reliefYears)))
                            .toList();
                    return new Scope3CategoryResponse(cat.getId(), cat.getName(), cat.getTooltip(), values);
                })
                .toList();

        return new EmissionsResponse(scope1, scope2, scope3);
    }

    private boolean isInRelief(int fiscalYear, int firstReportingYear, int reliefYears) {
        return reliefYears > 0 && fiscalYear >= firstReportingYear && (fiscalYear - firstReportingYear) < reliefYears;
    }

    @Transactional
    public EmissionsResponse setScopeValue(EmissionScope scope, int fiscalYear, SetEmissionValueRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        EmissionValue value = emissionValueRepository.findByCompanyIdAndScopeAndFiscalYear(companyId, scope, fiscalYear)
                .orElseGet(() -> {
                    EmissionValue v = new EmissionValue();
                    v.setCompanyId(companyId);
                    v.setScope(scope);
                    v.setFiscalYear(fiscalYear);
                    return v;
                });
        value.setValue(request.value());
        emissionValueRepository.save(value);
        return getEmissions();
    }

    @Transactional
    public Scope3CategoryResponse createScope3Category(CreateScope3CategoryRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        Scope3Category category = new Scope3Category();
        category.setCompanyId(companyId);
        category.setName(request.name());
        category.setTooltip(request.tooltip());
        category = scope3CategoryRepository.save(category);
        return new Scope3CategoryResponse(category.getId(), category.getName(), category.getTooltip(), List.of());
    }

    @Transactional
    public EmissionsResponse setScope3Value(UUID categoryId, int fiscalYear, SetEmissionValueRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        Scope3Category category = scope3CategoryRepository.findByIdAndCompanyId(categoryId, companyId)
                .orElseThrow(() -> new NotFoundException("Scope 3 category not found"));

        Scope3Value value = scope3ValueRepository.findByCategoryIdAndFiscalYear(categoryId, fiscalYear)
                .orElseGet(() -> {
                    Scope3Value v = new Scope3Value();
                    v.setCompanyId(companyId);
                    v.setCategory(category);
                    v.setFiscalYear(fiscalYear);
                    return v;
                });
        value.setValue(request.value());
        scope3ValueRepository.save(value);
        return getEmissions();
    }

    @Transactional
    public void deleteScope3Category(UUID categoryId) {
        UUID companyId = currentUserProvider.requireCompanyId();
        Scope3Category category = scope3CategoryRepository.findByIdAndCompanyId(categoryId, companyId)
                .orElseThrow(() -> new NotFoundException("Scope 3 category not found"));
        scope3ValueRepository.deleteByCategoryId(category.getId());
        scope3CategoryRepository.delete(category);
    }
}
