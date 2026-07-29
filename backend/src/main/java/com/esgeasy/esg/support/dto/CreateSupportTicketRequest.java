package com.esgeasy.esg.support.dto;

import com.esgeasy.esg.support.TicketPriority;
import com.esgeasy.esg.support.TicketType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSupportTicketRequest(
        @NotNull TicketType type,
        @NotBlank String subject,
        @NotBlank String message,
        TicketPriority priority
) {
}
