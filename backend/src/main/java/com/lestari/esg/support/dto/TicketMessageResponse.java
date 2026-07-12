package com.lestari.esg.support.dto;

import com.lestari.esg.support.TicketMessage;
import com.lestari.esg.user.Role;

import java.time.Instant;
import java.util.UUID;

public record TicketMessageResponse(
        UUID id,
        UUID ticketId,
        UUID senderId,
        String senderName,
        String senderEmail,
        Role senderRole,
        String message,
        Instant createdAt
) {
    public static TicketMessageResponse from(TicketMessage m) {
        return new TicketMessageResponse(
                m.getId(),
                m.getTicketId(),
                m.getSender().getId(),
                m.getSender().getName(),
                m.getSender().getEmail(),
                m.getSender().getRole(),
                m.getMessage(),
                m.getCreatedAt()
        );
    }
}
