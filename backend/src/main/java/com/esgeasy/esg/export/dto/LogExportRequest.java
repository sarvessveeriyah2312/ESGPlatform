package com.lestari.esg.export.dto;

import com.lestari.esg.export.ExportFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LogExportRequest(
        @NotBlank String exportType,
        @NotNull ExportFormat format,
        @NotNull Integer fiscalYear
) {
}
