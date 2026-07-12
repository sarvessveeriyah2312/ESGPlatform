package com.lestari.esg.governance;

import com.lestari.esg.governance.dto.CompliancePolicyResponse;
import com.lestari.esg.governance.dto.MarkPolicyReviewedRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/governance/compliance-policies")
@PreAuthorize("@planGate.check('governance')")
public class CompliancePolicyController {

    private final CompliancePolicyService compliancePolicyService;

    public CompliancePolicyController(CompliancePolicyService compliancePolicyService) {
        this.compliancePolicyService = compliancePolicyService;
    }

    @GetMapping
    public List<CompliancePolicyResponse> list() {
        return compliancePolicyService.getPolicies();
    }

    @PatchMapping("/{key}/review")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public CompliancePolicyResponse markReviewed(@PathVariable CompliancePolicyKey key, @RequestBody(required = false) MarkPolicyReviewedRequest request) {
        return compliancePolicyService.markReviewed(key, request != null ? request.documentUrl() : null);
    }
}
