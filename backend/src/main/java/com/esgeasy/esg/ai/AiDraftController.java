package com.esgeasy.esg.ai;

import com.esgeasy.esg.ai.dto.DraftRequest;
import com.esgeasy.esg.ai.dto.DraftResponse;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/company/ai/draft")
public class AiDraftController {

    private final AiDraftService service;

    public AiDraftController(AiDraftService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("@perm.check('ai.use')")
    public DraftResponse draft(@Valid @RequestBody DraftRequest request) {
        return service.draft(request);
    }
}
