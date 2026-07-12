package com.lestari.esg.governance;

import com.lestari.esg.common.TenantOwnedEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "compliance_policy", uniqueConstraints = @UniqueConstraint(columnNames = {"company_id", "policy_key"}))
@Getter
@Setter
@NoArgsConstructor
public class CompliancePolicy extends TenantOwnedEntity {

    @Column(name = "policy_key", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private CompliancePolicyKey policyKey;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "review_cycle_months", nullable = false)
    private Integer reviewCycleMonths;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;

    @Column(name = "document_url", length = 500)
    private String documentUrl;
}
