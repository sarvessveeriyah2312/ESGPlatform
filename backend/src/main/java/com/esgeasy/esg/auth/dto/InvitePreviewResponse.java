package com.esgeasy.esg.auth.dto;

import com.esgeasy.esg.user.Role;

public record InvitePreviewResponse(
        String companyName,
        String name,
        String email,
        Role role,
        String invitedByName
) {
}
