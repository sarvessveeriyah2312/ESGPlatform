package com.esgeasy.esg.session.dto;

import com.esgeasy.esg.session.UserSession;

import java.time.Instant;
import java.util.UUID;

public record SessionResponse(
        UUID id,
        String userAgent,
        String ipAddress,
        Instant createdAt,
        Instant lastSeenAt,
        boolean current
) {
    public static SessionResponse from(UserSession session, UUID currentJti) {
        boolean current = currentJti != null && session.getJti().equals(currentJti.toString());
        return new SessionResponse(
                session.getId(),
                session.getUserAgent(),
                session.getIpAddress(),
                session.getCreatedAt(),
                session.getLastSeenAt(),
                current
        );
    }
}
