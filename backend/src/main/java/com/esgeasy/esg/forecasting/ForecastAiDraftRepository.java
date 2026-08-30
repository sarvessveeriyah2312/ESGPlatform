package com.esgeasy.esg.forecasting;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ForecastAiDraftRepository extends JpaRepository<ForecastAiDraft, UUID> {
    Optional<ForecastAiDraft> findByCompanyIdAndIndicatorDefinitionId(UUID companyId, String indicatorDefinitionId);
}
