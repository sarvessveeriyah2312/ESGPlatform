package com.lestari.esg.auth.dto;

import com.lestari.esg.user.Role;

public record InvitePreviewResponse(
        String companyName,
        String name,
        String email,
        Role role,
        String invitedByName
) {
}
