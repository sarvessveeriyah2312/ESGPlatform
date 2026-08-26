package com.esgeasy.esg.ai.prompt;

import com.esgeasy.esg.ai.prompt.dto.IndicatorPromptResponse;
import com.esgeasy.esg.ai.prompt.dto.UpdateIndicatorPromptRequest;
import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.reference.IndicatorDefinition;
import com.esgeasy.esg.reference.IndicatorDefinitionRepository;
import com.esgeasy.esg.security.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Per-indicator customization of the "Extract with AI" prompt (see IndicatorExtractionService).
 * Every indicator shares the seeded {@code indicator-value-extraction} default (same row
 * PromptTemplateService resolves for the base case) unless a company has written a specific
 * override for that indicator — e.g. steering a computed ratio indicator like "Energy Intensity
 * per Revenue" (unit MWh/RM mil) away from ever trying to extract a number from a single document.
 */
@Service
public class IndicatorPromptService {

    private static final String BASE_DRAFT_TYPE = "indicator-value-extraction";

    private final PromptTemplateDefaultRepository defaultRepository;
    private final IndicatorPromptOverrideRepository overrideRepository;
    private final IndicatorDefinitionRepository indicatorDefinitionRepository;
    private final CurrentUserProvider currentUserProvider;

    public IndicatorPromptService(PromptTemplateDefaultRepository defaultRepository,
                                   IndicatorPromptOverrideRepository overrideRepository,
                                   IndicatorDefinitionRepository indicatorDefinitionRepository,
                                   CurrentUserProvider currentUserProvider) {
        this.defaultRepository = defaultRepository;
        this.overrideRepository = overrideRepository;
        this.indicatorDefinitionRepository = indicatorDefinitionRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public ResolvedPromptTemplate resolveForIndicator(String indicatorDefinitionId, UUID companyId) {
        return overrideRepository.findByCompanyIdAndIndicatorDefinitionId(companyId, indicatorDefinitionId)
                .map(o -> new ResolvedPromptTemplate(o.getSystemPrompt(), o.getUserPromptTemplate()))
                .orElseGet(this::baseDefault);
    }

    private ResolvedPromptTemplate baseDefault() {
        PromptTemplateDefault def = defaultRepository.findById(BASE_DRAFT_TYPE)
                .orElseThrow(() -> new IllegalStateException("Missing seeded default prompt: " + BASE_DRAFT_TYPE));
        return new ResolvedPromptTemplate(def.getSystemPrompt(), def.getUserPromptTemplate());
    }

    @Transactional(readOnly = true)
    public List<IndicatorPromptResponse> listForCompany() {
        UUID companyId = currentUserProvider.requireCompanyId();
        Map<String, IndicatorPromptOverride> overridesByIndicator = overrideRepository.findByCompanyId(companyId).stream()
                .collect(Collectors.toMap(IndicatorPromptOverride::getIndicatorDefinitionId, o -> o));
        ResolvedPromptTemplate base = baseDefault();

        return indicatorDefinitionRepository.findAll().stream()
                .sorted(Comparator.comparing(IndicatorDefinition::getName))
                .map(def -> toResponse(def, overridesByIndicator.get(def.getId()), base))
                .toList();
    }

    @Transactional
    public IndicatorPromptResponse upsertOverride(String indicatorDefinitionId, UpdateIndicatorPromptRequest request) {
        IndicatorDefinition def = requireIndicator(indicatorDefinitionId);
        UUID companyId = currentUserProvider.requireCompanyId();

        IndicatorPromptOverride override = overrideRepository.findByCompanyIdAndIndicatorDefinitionId(companyId, indicatorDefinitionId)
                .orElseGet(() -> {
                    IndicatorPromptOverride o = new IndicatorPromptOverride();
                    o.setCompanyId(companyId);
                    o.setIndicatorDefinitionId(indicatorDefinitionId);
                    return o;
                });
        override.setSystemPrompt(request.systemPrompt());
        override.setUserPromptTemplate(request.userPromptTemplate());
        overrideRepository.save(override);

        return new IndicatorPromptResponse(def.getId(), def.getName(), def.getUnit(),
                override.getSystemPrompt(), override.getUserPromptTemplate(), true);
    }

    @Transactional
    public IndicatorPromptResponse resetToDefault(String indicatorDefinitionId) {
        IndicatorDefinition def = requireIndicator(indicatorDefinitionId);
        UUID companyId = currentUserProvider.requireCompanyId();
        overrideRepository.deleteByCompanyIdAndIndicatorDefinitionId(companyId, indicatorDefinitionId);
        ResolvedPromptTemplate base = baseDefault();
        return new IndicatorPromptResponse(def.getId(), def.getName(), def.getUnit(),
                base.systemPrompt(), base.userPromptTemplate(), false);
    }

    private IndicatorDefinition requireIndicator(String indicatorDefinitionId) {
        return indicatorDefinitionRepository.findById(indicatorDefinitionId)
                .orElseThrow(() -> new NotFoundException("Indicator not found: " + indicatorDefinitionId));
    }

    private IndicatorPromptResponse toResponse(IndicatorDefinition def, IndicatorPromptOverride override, ResolvedPromptTemplate base) {
        boolean customized = override != null;
        return new IndicatorPromptResponse(
                def.getId(), def.getName(), def.getUnit(),
                customized ? override.getSystemPrompt() : base.systemPrompt(),
                customized ? override.getUserPromptTemplate() : base.userPromptTemplate(),
                customized
        );
    }
}
