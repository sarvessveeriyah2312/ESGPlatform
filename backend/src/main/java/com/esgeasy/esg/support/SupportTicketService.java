package com.esgeasy.esg.support;

import com.esgeasy.esg.activitylog.ActivityEventType;
import com.esgeasy.esg.activitylog.PlatformActivityLogService;
import com.esgeasy.esg.common.exceptions.ForbiddenException;
import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.support.dto.CreateSupportTicketRequest;
import com.esgeasy.esg.support.dto.SupportTicketResponse;
import com.esgeasy.esg.support.dto.UpdateSupportTicketRequest;
import com.esgeasy.esg.support.dto.UpdateTicketNoteRequest;
import com.esgeasy.esg.support.dto.UpdateTicketStatusRequest;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.CompanyRepository;
import com.esgeasy.esg.user.AppUser;
import com.esgeasy.esg.user.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class SupportTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final AppUserRepository appUserRepository;
    private final CompanyRepository companyRepository;
    private final CurrentUserProvider currentUserProvider;
    private final PlatformActivityLogService activityLogService;

    public SupportTicketService(SupportTicketRepository supportTicketRepository,
                                 AppUserRepository appUserRepository,
                                 CompanyRepository companyRepository,
                                 CurrentUserProvider currentUserProvider,
                                 PlatformActivityLogService activityLogService) {
        this.supportTicketRepository = supportTicketRepository;
        this.appUserRepository = appUserRepository;
        this.companyRepository = companyRepository;
        this.currentUserProvider = currentUserProvider;
        this.activityLogService = activityLogService;
    }

    @Transactional
    public SupportTicketResponse createTicket(CreateSupportTicketRequest request) {
        UUID userId = currentUserProvider.getPrincipal().userId();
        AppUser submitter = appUserRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("User not found"));

        SupportTicket ticket = new SupportTicket();
        ticket.setCompanyId(currentUserProvider.requireCompanyId());
        ticket.setSubmittedBy(submitter);
        ticket.setType(request.type());
        ticket.setSubject(request.subject());
        ticket.setMessage(request.message());
        ticket.setPriority(request.priority() != null ? request.priority() : TicketPriority.LOW);
        ticket.setStatus(TicketStatus.OPEN);

        ticket = supportTicketRepository.save(ticket);

        Company company = companyRepository.findById(ticket.getCompanyId()).orElse(null);
        activityLogService.record(ticket.getCompanyId(), company != null ? company.getName() : "Unknown company",
                ActivityEventType.SUPPORT_TICKET, "Logged ticket: \"" + ticket.getSubject() + "\"");

        return toResponse(ticket);
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listMyTickets() {
        UUID companyId = currentUserProvider.requireCompanyId();
        return supportTicketRepository.findByCompanyId(companyId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public SupportTicketResponse updateMyTicket(UUID id, UpdateSupportTicketRequest request) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));

        UUID userId = currentUserProvider.getPrincipal().userId();
        if (!ticket.getSubmittedBy().getId().equals(userId)) {
            throw new ForbiddenException("Only the original submitter can edit this ticket");
        }
        if (ticket.getStatus() != TicketStatus.OPEN) {
            throw new ForbiddenException("This ticket can no longer be edited");
        }

        ticket.setSubject(request.subject());
        ticket.setMessage(request.message());
        return toResponse(supportTicketRepository.save(ticket));
    }

    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listAllTickets() {
        return supportTicketRepository.findAll().stream().map(this::toResponse).toList();
    }

    /** Partner console's Feedback & Support tab — every company linked to the caller's own partner. A partner can also update status/note and reply — see {@link #updateStatusForPartner}, {@link #updateNoteForPartner}, and TicketMessageService.postMessageForPartner. */
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> listTicketsForPartner() {
        List<UUID> companyIds = partnerCompanyIds();
        if (companyIds.isEmpty()) {
            return List.of();
        }
        return supportTicketRepository.findByCompanyIdIn(companyIds).stream().map(this::toResponse).toList();
    }

    private List<UUID> partnerCompanyIds() {
        UUID partnerId = currentUserProvider.requirePartnerId();
        return companyRepository.findByPartnerIdOrderByNameAsc(partnerId).stream().map(Company::getId).toList();
    }

    /**
     * Partner console — a partner acts as first-line support for its own client companies' tickets:
     * claim/resolve status changes, same as platform admin's {@link #updateStatus}. Deliberately a
     * full write, not a narrower "OPEN→PENDING only" guard — a partner should be able to reopen a
     * ticket too if a client company follows up after it was marked resolved.
     */
    @Transactional
    public SupportTicketResponse updateStatusForPartner(UUID id, UpdateTicketStatusRequest request) {
        SupportTicket ticket = requireOwnedTicketForPartner(id);
        ticket.setStatus(request.status());
        return toResponse(supportTicketRepository.save(ticket));
    }

    /** Partner console — same shared note the tenant company and platform admin can already edit. */
    @Transactional
    public SupportTicketResponse updateNoteForPartner(UUID id, UpdateTicketNoteRequest request) {
        SupportTicket ticket = requireOwnedTicketForPartner(id);
        ticket.setNote(request.note());
        return toResponse(supportTicketRepository.save(ticket));
    }

    /** Same lookup as {@link #requireOwnedTicket}, but checks partner-company-set membership instead of a single companyId — the partner-console entry point into this service. */
    private SupportTicket requireOwnedTicketForPartner(UUID id) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        if (!partnerCompanyIds().contains(ticket.getCompanyId())) {
            throw new NotFoundException("Ticket not found");
        }
        return ticket;
    }

    @Transactional
    public SupportTicketResponse updateStatus(UUID id, UpdateTicketStatusRequest request) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        ticket.setStatus(request.status());
        return toResponse(supportTicketRepository.save(ticket));
    }

    /**
     * The note is shared between the company and platform admin — either side may edit it.
     * Platform-admin use only (SupportTicketAdminController is role-gated) — deliberately not
     * company-scoped, since admins manage every tenant's tickets. Tenant-facing edits must go
     * through {@link #updateNoteForCurrentCompany} instead.
     */
    @Transactional
    public SupportTicketResponse updateNote(UUID id, UpdateTicketNoteRequest request) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        ticket.setNote(request.note());
        return toResponse(supportTicketRepository.save(ticket));
    }

    /** Tenant-facing use (SupportTicketController) — the ticket must belong to the caller's own company. */
    @Transactional
    public SupportTicketResponse updateNoteForCurrentCompany(UUID id, UpdateTicketNoteRequest request) {
        SupportTicket ticket = requireOwnedTicket(id);
        ticket.setNote(request.note());
        return toResponse(supportTicketRepository.save(ticket));
    }

    /** Same lookup {@link #updateStatus} etc. use, plus a same-company check — the tenant-facing entry point into this service. */
    private SupportTicket requireOwnedTicket(UUID id) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        UUID companyId = currentUserProvider.requireCompanyId();
        if (!companyId.equals(ticket.getCompanyId())) {
            throw new NotFoundException("Ticket not found");
        }
        return ticket;
    }

    private SupportTicketResponse toResponse(SupportTicket ticket) {
        String companyName = companyRepository.findById(ticket.getCompanyId())
                .map(Company::getName)
                .orElse(null);
        return SupportTicketResponse.from(ticket, companyName);
    }
}
