package com.esgeasy.esg.assurance.dto;

import com.esgeasy.esg.assurance.SignOffAuditEntry;
import com.esgeasy.esg.assurance.SignOffStatus;

import java.time.Instant;

public record SignOffAuditEntryResponse(
        SignOffStatus action,
        String actorName,
        String actorTitle,
        String notes,
        String hash,
        Instant timestamp
) {
    public static SignOffAuditEntryResponse from(SignOffAuditEntry e) {
        return new SignOffAuditEntryResponse(e.getAction(), e.getActorName(), e.getActorTitle(), e.getNotes(), e.getHash(), e.getCreatedAt());
    }
}
