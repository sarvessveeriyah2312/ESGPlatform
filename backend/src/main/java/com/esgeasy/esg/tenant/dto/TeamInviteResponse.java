package com.esgeasy.esg.tenant.dto;

import com.esgeasy.esg.tenant.TeamInvite;
import com.esgeasy.esg.user.Role;

import java.time.Instant;
import java.util.UUID;

public record TeamInviteResponse(
        UUID id,
        String name,
        String email,
        Role role,
        UUID customRoleId,
        String customRoleName,
        String invitedByName,
        Instant createdAt,
        Instant expiresAt,
        boolean expired,
        String inviteUrl
) {
    public static TeamInviteResponse from(TeamInvite invite, String inviteUrl) {
        return new TeamInviteResponse(
                invite.getId(), invite.getName(), invite.getEmail(), invite.getRole(),
                invite.getCustomRole() != null ? invite.getCustomRole().getId() : null,
                invite.getCustomRole() != null ? invite.getCustomRole().getName() : null,
                invite.getInvitedByName(),
                invite.getCreatedAt(), invite.getExpiresAt(), invite.getExpiresAt().isBefore(Instant.now()), inviteUrl
        );
    }
}
