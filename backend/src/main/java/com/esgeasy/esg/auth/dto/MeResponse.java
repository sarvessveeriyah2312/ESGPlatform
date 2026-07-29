package com.esgeasy.esg.auth.dto;

import com.esgeasy.esg.tenant.MarketClassification;
import com.esgeasy.esg.tenant.SubscriptionPlan;
import com.esgeasy.esg.user.Role;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MeResponse(
        UUID userId,
        String name,
        String email,
        Role role,
        UUID companyId,
        String companyName,
        String sectorCode,
        MarketClassification market,
        SubscriptionPlan plan,
        boolean onboardingCompleted,
        List<String> frameworks,
        List<String> priorities,
        String phone,
        LocalDate dateOfBirth,
        String address,
        String bio,
        boolean hasAvatar,
        boolean mfaSetupRequired,
        List<String> permissions
) {
}
