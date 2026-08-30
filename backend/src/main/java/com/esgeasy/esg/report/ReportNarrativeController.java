package com.esgeasy.esg.report;

import com.esgeasy.esg.report.dto.ReportNarrativeResponse;
import com.esgeasy.esg.report.dto.UpdateReportNarrativeRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/company/report-narrative")
public class ReportNarrativeController {

    private final ReportNarrativeService service;

    public ReportNarrativeController(ReportNarrativeService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@perm.check('settings.view') or @perm.check('settings.manage')")
    public ReportNarrativeResponse get() {
        return service.get();
    }

    @PutMapping
    @PreAuthorize("@perm.check('settings.manage')")
    public ReportNarrativeResponse update(@Valid @RequestBody UpdateReportNarrativeRequest request) {
        return service.update(request);
    }
}
