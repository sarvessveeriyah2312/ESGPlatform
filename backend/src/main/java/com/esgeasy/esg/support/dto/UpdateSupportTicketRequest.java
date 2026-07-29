package com.esgeasy.esg.support.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateSupportTicketRequest(
        @NotBlank String subject,
        @NotBlank String message
) {
}
