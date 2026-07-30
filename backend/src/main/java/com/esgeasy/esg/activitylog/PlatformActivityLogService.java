package com.esgeasy.esg.activitylog;

import com.esgeasy.esg.common.exceptions.NotFoundException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PlatformActivityLogService {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 500;

    private final PlatformActivityLogRepository repository;

    public PlatformActivityLogService(PlatformActivityLogRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void record(UUID companyId, String companyName, ActivityEventType eventType, String description) {
        PlatformActivityLog log = new PlatformActivityLog();
        log.setCompanyId(companyId);
        log.setCompanyName(companyName);
        log.setEventType(eventType);
        log.setDescription(description);
        repository.save(log);
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> listRecent(Integer limit) {
        return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, effectiveLimit(limit))).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivityLogResponse getById(UUID id) {
        PlatformActivityLog log = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Audit log entry not found"));
        return toResponse(log);
    }

    @Transactional(readOnly = true)
    public List<ActivityLogResponse> listRecentForCompany(UUID companyId, Integer limit) {
        return repository.findByCompanyIdOrderByCreatedAtDesc(companyId, PageRequest.of(0, effectiveLimit(limit))).stream()
                .map(this::toResponse)
                .toList();
    }

    private int effectiveLimit(Integer limit) {
        return limit == null ? DEFAULT_LIMIT : Math.max(1, Math.min(limit, MAX_LIMIT));
    }

    private ActivityLogResponse toResponse(PlatformActivityLog log) {
        return new ActivityLogResponse(log.getId(), log.getCreatedAt(), log.getCompanyId(), log.getCompanyName(), log.getEventType(), log.getDescription());
    }
}
