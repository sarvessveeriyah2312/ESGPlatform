package com.lestari.esg.governance.dto;

import com.lestari.esg.governance.CompliancePolicy;
import com.lestari.esg.governance.ComplianceStatus;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public record CompliancePolicyResponse(
        String policyKey,
        String name,
        String description,
        int reviewCycleMonths,
        Instant lastReviewedAt,
        Instant nextReviewDueAt,
        String documentUrl,
        ComplianceStatus status
) {
    private static final long DUE_SOON_WINDOW_DAYS = 60;
    private static final long DAYS_PER_MONTH = 30;

    public static CompliancePolicyResponse from(CompliancePolicy p) {
        Instant lastReviewed = p.getLastReviewedAt();
        Instant nextDue = lastReviewed != null
                ? lastReviewed.plus(p.getReviewCycleMonths() * DAYS_PER_MONTH, ChronoUnit.DAYS)
                : null;

        ComplianceStatus status;
        if (lastReviewed == null) {
            status = ComplianceStatus.NOT_ESTABLISHED;
        } else {
            Instant now = Instant.now();
            if (nextDue.isBefore(now)) {
                status = ComplianceStatus.OVERDUE;
            } else if (nextDue.isBefore(now.plus(DUE_SOON_WINDOW_DAYS, ChronoUnit.DAYS))) {
                status = ComplianceStatus.DUE_SOON;
            } else {
                status = ComplianceStatus.CURRENT;
            }
        }

        return new CompliancePolicyResponse(
                p.getPolicyKey().name(), p.getName(), p.getDescription(), p.getReviewCycleMonths(),
                lastReviewed, nextDue, p.getDocumentUrl(), status
        );
    }
}
