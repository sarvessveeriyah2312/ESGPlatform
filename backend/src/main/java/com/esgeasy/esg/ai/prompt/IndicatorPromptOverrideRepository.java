package com.esgeasy.esg.ai.prompt;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IndicatorPromptOverrideRepository extends JpaRepository<IndicatorPromptOverride, UUID> {
    Optional<IndicatorPromptOverride> findByCompanyIdAndIndicatorDefinitionId(UUID companyId, String indicatorDefinitionId);
    List<IndicatorPromptOverride> findByCompanyId(UUID companyId);
    void deleteByCompanyIdAndIndicatorDefinitionId(UUID companyId, String indicatorDefinitionId);
}
