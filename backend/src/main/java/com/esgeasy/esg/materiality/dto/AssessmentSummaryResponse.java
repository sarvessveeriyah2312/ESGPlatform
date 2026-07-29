package com.esgeasy.esg.materiality.dto;

import com.esgeasy.esg.materiality.AssessmentStatus;
import com.esgeasy.esg.materiality.MaterialityAssessment;
import com.esgeasy.esg.tenant.MarketClassification;
import com.esgeasy.esg.tenant.SubscriptionPlan;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AssessmentSummaryResponse(
        UUID id,
        String name,
        LocalDate assessmentDate,
        SubscriptionPlan planAtCapture,
        MarketClassification marketAtCapture,
        String createdByName,
        AssessmentStatus status,
        String validatedByName,
        Instant validatedAt
) {
    public static AssessmentSummaryResponse from(MaterialityAssessment a) {
        return new AssessmentSummaryResponse(
                a.getId(), a.getName(), a.getAssessmentDate(), a.getPlanAtCapture(), a.getMarketAtCapture(), a.getCreatedByName(),
                a.getStatus(), a.getValidatedByName(), a.getValidatedAt()
        );
    }
}
