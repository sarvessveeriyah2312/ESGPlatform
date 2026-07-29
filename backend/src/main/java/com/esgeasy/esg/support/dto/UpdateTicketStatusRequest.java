package com.esgeasy.esg.support.dto;

import com.esgeasy.esg.support.TicketStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateTicketStatusRequest(@NotNull TicketStatus status) {
}
