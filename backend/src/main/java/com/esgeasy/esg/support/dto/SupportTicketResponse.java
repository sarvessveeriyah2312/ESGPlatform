package com.esgeasy.esg.support.dto;

import com.esgeasy.esg.support.SupportTicket;
import com.esgeasy.esg.support.TicketPriority;
import com.esgeasy.esg.support.TicketStatus;
import com.esgeasy.esg.support.TicketType;

import java.time.Instant;
import java.util.UUID;

public record SupportTicketResponse(
        UUID id,
        TicketType type,
        String subject,
        String message,
        TicketPriority priority,
        TicketStatus status,
        Instant createdAt,
        UUID submittedByUserId,
        String submittedByName,
        String submittedByEmail,
        String companyName,
        String note
) {
    public static SupportTicketResponse from(SupportTicket t, String companyName) {
        return new SupportTicketResponse(
                t.getId(),
                t.getType(),
                t.getSubject(),
                t.getMessage(),
                t.getPriority(),
                t.getStatus(),
                t.getCreatedAt(),
                t.getSubmittedBy().getId(),
                t.getSubmittedBy().getName(),
                t.getSubmittedBy().getEmail(),
                companyName,
                t.getNote()
        );
    }
}
