package com.esgeasy.esg.support.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTicketMessageRequest(
        @NotBlank String message
) {
}
