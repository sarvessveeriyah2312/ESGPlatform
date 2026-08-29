package com.esgeasy.esg.support;

import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.support.dto.CreateTicketMessageRequest;
import com.esgeasy.esg.support.dto.TicketMessageResponse;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.CompanyRepository;
import com.esgeasy.esg.user.AppUser;
import com.esgeasy.esg.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class TicketMessageService {

    private final TicketMessageRepository ticketMessageRepository;
    private final SupportTicketRepository supportTicketRepository;
    private final AppUserRepository appUserRepository;
    private final CompanyRepository companyRepository;
    private final CurrentUserProvider currentUserProvider;

    public TicketMessageService(TicketMessageRepository ticketMessageRepository,
                                 SupportTicketRepository supportTicketRepository,
                                 AppUserRepository appUserRepository,
                                 CompanyRepository companyRepository,
                                 CurrentUserProvider currentUserProvider) {
        this.ticketMessageRepository = ticketMessageRepository;
        this.supportTicketRepository = supportTicketRepository;
        this.appUserRepository = appUserRepository;
        this.companyRepository = companyRepository;
        this.currentUserProvider = currentUserProvider;
    }

    /** Platform-admin use only (SupportTicketAdminController is role-gated to PLATFORM_ADMIN/SUPERADMIN) — deliberately not company-scoped, since admins manage every tenant's tickets. */
    @Transactional(readOnly = true)
    public List<TicketMessageResponse> listMessages(UUID ticketId) {
        requireTicket(ticketId);
        return fetchMessages(ticketId);
    }

    /** Tenant-facing use (SupportTicketController) — the ticket must belong to the caller's own company. */
    @Transactional(readOnly = true)
    public List<TicketMessageResponse> listMessagesForCurrentCompany(UUID ticketId) {
        requireOwnedTicket(ticketId);
        return fetchMessages(ticketId);
    }

    /** Partner console use — the ticket's company must be one of the caller's own partner's companies. */
    @Transactional(readOnly = true)
    public List<TicketMessageResponse> listMessagesForPartner(UUID ticketId) {
        requireOwnedTicketForPartner(ticketId);
        return fetchMessages(ticketId);
    }

    /** Partner console use — a partner replying as first-line support for its own client's ticket. See {@link #listMessagesForPartner}. */
    @Transactional
    public TicketMessageResponse postMessageForPartner(UUID ticketId, CreateTicketMessageRequest request) {
        SupportTicket ticket = requireOwnedTicketForPartner(ticketId);
        return saveMessage(ticket, request);
    }

    /** Platform-admin use only — see {@link #listMessages}. */
    @Transactional
    public TicketMessageResponse postMessage(UUID ticketId, CreateTicketMessageRequest request) {
        SupportTicket ticket = requireTicket(ticketId);
        return saveMessage(ticket, request);
    }

    /** Tenant-facing use — see {@link #listMessagesForCurrentCompany}. */
    @Transactional
    public TicketMessageResponse postMessageForCurrentCompany(UUID ticketId, CreateTicketMessageRequest request) {
        SupportTicket ticket = requireOwnedTicket(ticketId);
        return saveMessage(ticket, request);
    }

    private List<TicketMessageResponse> fetchMessages(UUID ticketId) {
        return ticketMessageRepository.findByTicketIdOrderByCreatedAtAsc(ticketId).stream()
                .map(TicketMessageResponse::from)
                .toList();
    }

    private TicketMessageResponse saveMessage(SupportTicket ticket, CreateTicketMessageRequest request) {
        UUID userId = currentUserProvider.getPrincipal().userId();
        AppUser sender = appUserRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        TicketMessage message = new TicketMessage();
        message.setCompanyId(ticket.getCompanyId());
        message.setTicketId(ticket.getId());
        message.setSender(sender);
        message.setMessage(request.message());

        return TicketMessageResponse.from(ticketMessageRepository.save(message));
    }

    private SupportTicket requireTicket(UUID ticketId) {
        return supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
    }

    /** Same lookup as {@link #requireTicket}, plus a same-company check — the tenant-facing entry point into this service. */
    private SupportTicket requireOwnedTicket(UUID ticketId) {
        SupportTicket ticket = requireTicket(ticketId);
        UUID companyId = currentUserProvider.requireCompanyId();
        if (!companyId.equals(ticket.getCompanyId())) {
            throw new NotFoundException("Ticket not found");
        }
        return ticket;
    }

    /** Same lookup as {@link #requireTicket}, plus a same-partner check — the partner-console entry point into this service. */
    private SupportTicket requireOwnedTicketForPartner(UUID ticketId) {
        SupportTicket ticket = requireTicket(ticketId);
        UUID partnerId = currentUserProvider.requirePartnerId();
        List<UUID> companyIds = companyRepository.findByPartnerIdOrderByNameAsc(partnerId).stream().map(Company::getId).toList();
        if (!companyIds.contains(ticket.getCompanyId())) {
            throw new NotFoundException("Ticket not found");
        }
        return ticket;
    }
}
