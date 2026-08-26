package com.esgeasy.esg.ai.prompt;

import com.esgeasy.esg.ai.prompt.dto.IndicatorPromptResponse;
import com.esgeasy.esg.ai.prompt.dto.UpdateIndicatorPromptRequest;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Per-indicator "Extract with AI" prompt overrides — a companion to PromptTemplateController's feature-level prompts. */
@RestController
@RequestMapping("/api/v1/company/ai/indicator-prompts")
public class IndicatorPromptController {

    private final IndicatorPromptService service;

    public IndicatorPromptController(IndicatorPromptService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@perm.check('prompts.view') or @perm.check('prompts.manage')")
    public List<IndicatorPromptResponse> list() {
        return service.listForCompany();
    }

    @PutMapping("/{indicatorId}")
    @PreAuthorize("@perm.check('prompts.manage')")
    public IndicatorPromptResponse update(@PathVariable String indicatorId, @Valid @RequestBody UpdateIndicatorPromptRequest request) {
        return service.upsertOverride(indicatorId, request);
    }

    @DeleteMapping("/{indicatorId}/override")
    @PreAuthorize("@perm.check('prompts.manage')")
    public IndicatorPromptResponse resetToDefault(@PathVariable String indicatorId) {
        return service.resetToDefault(indicatorId);
    }
}
