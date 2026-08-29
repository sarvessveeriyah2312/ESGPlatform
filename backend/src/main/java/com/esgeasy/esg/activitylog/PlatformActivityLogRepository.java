package com.esgeasy.esg.activitylog;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface PlatformActivityLogRepository extends JpaRepository<PlatformActivityLog, UUID> {
    List<PlatformActivityLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<PlatformActivityLog> findByCompanyIdOrderByCreatedAtDesc(UUID companyId, Pageable pageable);

    /** Backs the partner console's Audit Log tab — every company linked to one partner. */
    List<PlatformActivityLog> findByCompanyIdInOrderByCreatedAtDesc(List<UUID> companyIds, Pageable pageable);
}
