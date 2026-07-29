package com.esgeasy.esg.materiality.dto;

import com.esgeasy.esg.materiality.AssessmentStatus;
import com.esgeasy.esg.tenant.MarketClassification;
import com.esgeasy.esg.tenant.SubscriptionPlan;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AssessmentDetailResponse(
        UUID id,
        String name,
        LocalDate assessmentDate,
        SubscriptionPlan planAtCapture,
        MarketClassification marketAtCapture,
        String createdByName,
        AssessmentStatus status,
        String validatedByName,
        Instant validatedAt,
        List<String> stakeholders,
        List<ScoreResponse> scores
) {
}
