package com.lestari.esg.export.dto;

import com.lestari.esg.export.ExportFormat;
import com.lestari.esg.export.ExportHistoryItem;

import java.time.Instant;
import java.util.UUID;

public record ExportHistoryResponse(
        UUID id,
        Instant generatedAt,
        String exportType,
        ExportFormat format,
        int fiscalYear,
        String generatedByName,
        String signedOffByName,
        Instant signedOffAt
) {
    public static ExportHistoryResponse from(ExportHistoryItem item) {
        return new ExportHistoryResponse(item.getId(), item.getCreatedAt(), item.getExportType(), item.getFormat(), item.getFiscalYear(), item.getGeneratedByName(), item.getSignedOffByName(), item.getSignedOffAt());
    }
}
