package com.lestari.esg.governance;

import com.lestari.esg.common.exceptions.NotFoundException;
import com.lestari.esg.governance.dto.CompliancePolicyResponse;
import com.lestari.esg.security.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CompliancePolicyService {

    private static final Map<CompliancePolicyKey, Object[]> DEFAULT_POLICIES = Map.of(
            CompliancePolicyKey.ANTI_CORRUPTION, new Object[]{
                    "Anti-Corruption Policy (Section 17A MACC Act)",
                    "Section 17A of the Malaysian Anti-Corruption Commission Act 2009 requires listed issuers to establish and maintain adequate anti-corruption procedures, reviewed at least once every 3 years and published on the company website.",
                    36
            },
            CompliancePolicyKey.WHISTLEBLOWING, new Object[]{
                    "Whistleblowing Policy & Procedures",
                    "Bursa Malaysia Listing Requirements mandate whistle-blowing policies and procedures be established, maintained, periodically reviewed (at least every 3 years), and published on the company website.",
                    36
            },
            CompliancePolicyKey.BOARD_GENDER_DIVERSITY, new Object[]{
                    "Board Gender Diversity Policy (≥30% women directors)",
                    "Bursa Malaysia requires listed issuer boards to have at least 30% women directors, with the board's gender diversity policy disclosed in the annual report.",
                    12
            }
    );

    private final CompliancePolicyRepository repository;
    private final CurrentUserProvider currentUserProvider;

    public CompliancePolicyService(CompliancePolicyRepository repository, CurrentUserProvider currentUserProvider) {
        this.repository = repository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional
    public List<CompliancePolicyResponse> getPolicies() {
        UUID companyId = currentUserProvider.requireCompanyId();
        List<CompliancePolicy> policies = repository.findByCompanyId(companyId);
        if (policies.isEmpty()) {
            for (var entry : DEFAULT_POLICIES.entrySet()) {
                CompliancePolicy policy = new CompliancePolicy();
                policy.setCompanyId(companyId);
                policy.setPolicyKey(entry.getKey());
                policy.setName((String) entry.getValue()[0]);
                policy.setDescription((String) entry.getValue()[1]);
                policy.setReviewCycleMonths((Integer) entry.getValue()[2]);
                repository.save(policy);
            }
            policies = repository.findByCompanyId(companyId);
        }
        return policies.stream().map(CompliancePolicyResponse::from).toList();
    }

    @Transactional
    public CompliancePolicyResponse markReviewed(CompliancePolicyKey key, String documentUrl) {
        UUID companyId = currentUserProvider.requireCompanyId();
        CompliancePolicy policy = repository.findByCompanyIdAndPolicyKey(companyId, key)
                .orElseThrow(() -> new NotFoundException("Unknown compliance policy: " + key));
        policy.setLastReviewedAt(Instant.now());
        if (documentUrl != null && !documentUrl.isBlank()) {
            policy.setDocumentUrl(documentUrl);
        }
        return CompliancePolicyResponse.from(repository.save(policy));
    }
}
