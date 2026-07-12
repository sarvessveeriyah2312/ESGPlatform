package com.lestari.esg.support.dto;

import com.lestari.esg.support.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTicketStatusRequest(@NotNull TicketStatus status) {
}
