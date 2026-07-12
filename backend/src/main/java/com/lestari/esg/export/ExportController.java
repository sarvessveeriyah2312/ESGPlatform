package com.lestari.esg.export;

import com.lestari.esg.export.dto.ExportHistoryResponse;
import com.lestari.esg.export.dto.LogExportRequest;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/exports")
@PreAuthorize("@planGate.check('reports')")
public class ExportController {

    private final ExportService exportService;
    private final IntegratedReportService integratedReportService;

    public ExportController(ExportService exportService, IntegratedReportService integratedReportService) {
        this.exportService = exportService;
        this.integratedReportService = integratedReportService;
    }

    @GetMapping("/integrated-report.pdf")
    public ResponseEntity<byte[]> integratedReport(@RequestParam int fiscalYear) {
        IntegratedReportService.GeneratedReport report = integratedReportService.generateReport(fiscalYear);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename(report.filename()).build());
        return ResponseEntity.ok().headers(headers).contentType(MediaType.APPLICATION_PDF).body(report.content());
    }

    @PostMapping("/csv")
    public ResponseEntity<byte[]> exportCsv(@RequestParam int fiscalYear) {
        byte[] csv = exportService.generateRawIndicatorCsv(fiscalYear);
        return csvResponse(csv, "Lestari_Raw_Indicators_Ledger_FY" + fiscalYear + ".csv");
    }

    @PostMapping("/csi")
    @PreAuthorize("@planGate.check('csi-export')")
    public ResponseEntity<byte[]> exportCsi(@RequestParam int fiscalYear) {
        byte[] csv = exportService.generateCsiExportCsv(fiscalYear);
        return csvResponse(csv, "Bursa_CSI_Manual_Import_FY" + fiscalYear + ".csv");
    }

    @GetMapping("/history")
    public List<ExportHistoryResponse> history() {
        return exportService.listHistory();
    }

    @PostMapping("/log")
    public ResponseEntity<Void> log(@Valid @RequestBody LogExportRequest request) {
        exportService.logClientGeneratedExport(request);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/history/{id}/sign-off")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ExportHistoryResponse signOff(@PathVariable UUID id) {
        return exportService.signOff(id);
    }

    private ResponseEntity<byte[]> csvResponse(byte[] body, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(ContentDisposition.attachment().filename(filename).build());
        return ResponseEntity.ok().headers(headers).contentType(MediaType.parseMediaType("text/csv")).body(body);
    }
}
