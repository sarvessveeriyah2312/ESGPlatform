package com.esgeasy.esg.support;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, UUID> {
    List<SupportTicket> findByCompanyId(UUID companyId);
    /** Backs the partner console's Feedback & Support tab — every company linked to one partner. */
    List<SupportTicket> findByCompanyIdIn(List<UUID> companyIds);
}
