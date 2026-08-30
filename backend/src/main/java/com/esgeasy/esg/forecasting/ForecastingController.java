package com.esgeasy.esg.forecasting;

import com.esgeasy.esg.forecasting.dto.ForecastNarrativeResponse;
import com.esgeasy.esg.forecasting.dto.ForecastSummaryResponse;
import com.esgeasy.esg.forecasting.dto.IndicatorForecastResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/forecasting")
@PreAuthorize("@planGate.check('ai-forecasting')")
public class ForecastingController {

    private final ForecastingService service;

    public ForecastingController(ForecastingService service) {
        this.service = service;
    }

    @GetMapping
    public List<ForecastSummaryResponse> list() {
        return service.list();
    }

    @GetMapping("/{indicatorId}")
    public IndicatorForecastResponse getForecast(@PathVariable String indicatorId) {
        return service.getForecast(indicatorId);
    }

    @PostMapping("/{indicatorId}/narrative")
    @PreAuthorize("@perm.check('ai.use')")
    public ForecastNarrativeResponse generateNarrative(@PathVariable String indicatorId) {
        return service.generateNarrative(indicatorId);
    }

    @PostMapping("/{indicatorId}/action-plan")
    @PreAuthorize("@perm.check('ai.use')")
    public ForecastNarrativeResponse generateActionPlan(@PathVariable String indicatorId) {
        return service.generateActionPlan(indicatorId);
    }
}
