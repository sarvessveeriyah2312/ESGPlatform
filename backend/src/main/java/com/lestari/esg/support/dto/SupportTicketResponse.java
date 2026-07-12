package com.lestari.esg.support.dto;

import com.lestari.esg.support.SupportTicket;
import com.lestari.esg.support.TicketPriority;
import com.lestari.esg.support.TicketStatus;
import com.lestari.esg.support.TicketType;

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
