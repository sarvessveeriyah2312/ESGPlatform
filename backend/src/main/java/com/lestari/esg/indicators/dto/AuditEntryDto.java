package com.lestari.esg.indicators.dto;

import com.lestari.esg.indicators.IndicatorAuditEntry;

import java.math.BigDecimal;
import java.time.Instant;

public record AuditEntryDto(
        java.util.UUID id,
        int fiscalYear,
        BigDecimal value,
        String enteredBy,
        Instant enteredAt,
        String sourceDocName,
        String sourceDocPath,
        String comment
) {
    public static AuditEntryDto from(IndicatorAuditEntry e) {
        return new AuditEntryDto(e.getId(), e.getFiscalYear(), e.getValue(), e.getEnteredBy(), e.getCreatedAt(), e.getSourceDocName(), e.getSourceDocPath(), e.getComment());
    }
}
