package com.esgeasy.esg.report;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReportNarrativeRepository extends JpaRepository<ReportNarrative, UUID> {
    Optional<ReportNarrative> findByCompanyId(UUID companyId);
}
