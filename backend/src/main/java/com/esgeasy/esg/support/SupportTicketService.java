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

    @Transactional
    public SupportTicketResponse updateStatus(UUID id, UpdateTicketStatusRequest request) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        ticket.setStatus(request.status());
        return toResponse(supportTicketRepository.save(ticket));
    }

    /** The note is shared between the company and platform admin — either side may edit it. */
    @Transactional
    public SupportTicketResponse updateNote(UUID id, UpdateTicketNoteRequest request) {
        SupportTicket ticket = supportTicketRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Ticket not found"));
        ticket.setNote(request.note());
        return toResponse(supportTicketRepository.save(ticket));
    }

    private SupportTicketResponse toResponse(SupportTicket ticket) {
        String companyName = companyRepository.findById(ticket.getCompanyId())
                .map(Company::getName)
                .orElse(null);
        return SupportTicketResponse.from(ticket, companyName);
    }
}
