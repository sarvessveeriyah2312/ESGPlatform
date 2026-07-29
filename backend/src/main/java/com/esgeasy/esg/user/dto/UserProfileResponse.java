package com.lestari.esg.user.dto;

import com.lestari.esg.user.Role;

import java.time.Instant;
import java.util.UUID;

public record UserProfileResponse(
        UUID userId,
        String name,
        String email,
        Role role,
        String companyName,
        String phone,
        String jobTitle,
        String department,
        String bio,
        String avatarColor,
        Instant memberSince
) {
}
