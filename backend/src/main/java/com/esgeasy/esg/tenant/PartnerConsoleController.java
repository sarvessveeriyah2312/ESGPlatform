package com.esgeasy.esg.tenant;

import com.esgeasy.esg.activitylog.ActivityLogResponse;
import com.esgeasy.esg.billing.dto.InvoiceResponse;
import com.esgeasy.esg.support.dto.CreateTicketMessageRequest;
import com.esgeasy.esg.support.dto.SupportTicketResponse;
import com.esgeasy.esg.support.dto.TicketMessageResponse;
import com.esgeasy.esg.support.dto.UpdateTicketNoteRequest;
import com.esgeasy.esg.support.dto.UpdateTicketStatusRequest;
import com.esgeasy.esg.tenant.dto.CreatePartnerAdminUserRequest;
import com.esgeasy.esg.tenant.dto.CreatePartnerAdminUserResponse;
import com.esgeasy.esg.tenant.dto.PartnerBrandingResponse;
import com.esgeasy.esg.tenant.dto.PartnerCompanySummaryResponse;
import com.esgeasy.esg.tenant.dto.PartnerRevenueSummaryResponse;
import com.esgeasy.esg.tenant.dto.PartnerSecuritySettingsResponse;
import com.esgeasy.esg.tenant.dto.PartnerUserResponse;
import com.esgeasy.esg.tenant.dto.StripeConnectLinkResponse;
import com.esgeasy.esg.tenant.dto.UpdatePartnerBrandingRequest;
import com.esgeasy.esg.tenant.dto.UpdatePartnerSecuritySettingsRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * A signed-in partner's own scoped self-service console:
 * its companies, its own branding, its Stripe Connect revenue-share status, its own team of
 * PARTNER_ADMIN logins, billing history, audit log, and first-line support over its client
 * companies' tickets (reply, note, claim/resolve). Every method delegates to a
 * {@code PartnerService} method that resolves the caller's partner via
 * {@code CurrentUserProvider.requirePartnerId()} — there is no partnerId path variable anywhere
 * here, unlike the platform-admin {@link PartnerController}, so a partner can never reach into
 * another partner's data by changing an id in the URL.
 */
@RestController
@RequestMapping("/api/v1/partner")
@PreAuthorize("hasRole('PARTNER_ADMIN')")
public class PartnerConsoleController {

    private final PartnerService partnerService;

    public PartnerConsoleController(PartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @GetMapping("/companies")
    public List<PartnerCompanySummaryResponse> myCompanies() {
        return partnerService.listMyCompanies();
    }

    @GetMapping("/branding")
    public PartnerBrandingResponse getBranding() {
        return partnerService.getMyBranding();
    }

    @PutMapping("/branding")
    public PartnerBrandingResponse updateBranding(@Valid @RequestBody UpdatePartnerBrandingRequest request) {
        return partnerService.updateMyBranding(request);
    }

    @GetMapping("/revenue")
    public PartnerRevenueSummaryResponse revenue() {
        return partnerService.getMyRevenueSummary();
    }

    @PostMapping("/stripe-connect/link")
    public StripeConnectLinkResponse startStripeConnectOnboarding() {
        return partnerService.startMyStripeConnectOnboarding();
    }

    @GetMapping("/users")
    public List<PartnerUserResponse> users() {
        return partnerService.listMyUsers();
    }

    @PostMapping("/users")
    public CreatePartnerAdminUserResponse inviteUser(@Valid @RequestBody CreatePartnerAdminUserRequest request) {
        return partnerService.inviteMyTeammate(request);
    }

    @PatchMapping("/users/{userId}/active")
    public ResponseEntity<Void> setUserActive(@PathVariable UUID userId, @RequestParam boolean active) {
        partnerService.setMyTeammateActive(userId, active);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invoices")
    public List<InvoiceResponse> invoices() {
        return partnerService.listMyInvoices();
    }

    @GetMapping("/support-tickets")
    public List<SupportTicketResponse> supportTickets() {
        return partnerService.listMyTickets();
    }

    @GetMapping("/support-tickets/{ticketId}/messages")
    public List<TicketMessageResponse> supportTicketMessages(@PathVariable UUID ticketId) {
        return partnerService.listMyTicketMessages(ticketId);
    }

    @PostMapping("/support-tickets/{ticketId}/messages")
    public TicketMessageResponse postSupportTicketMessage(@PathVariable UUID ticketId, @Valid @RequestBody CreateTicketMessageRequest request) {
        return partnerService.postMyTicketMessage(ticketId, request.message());
    }

    @PatchMapping("/support-tickets/{ticketId}/status")
    public SupportTicketResponse updateSupportTicketStatus(@PathVariable UUID ticketId, @Valid @RequestBody UpdateTicketStatusRequest request) {
        return partnerService.updateMyTicketStatus(ticketId, request.status());
    }

    @PatchMapping("/support-tickets/{ticketId}/note")
    public SupportTicketResponse updateSupportTicketNote(@PathVariable UUID ticketId, @RequestBody UpdateTicketNoteRequest request) {
        return partnerService.updateMyTicketNote(ticketId, request.note());
    }

    @GetMapping("/audit-log")
    public List<ActivityLogResponse> auditLog(@RequestParam(required = false) Integer limit) {
        return partnerService.listMyActivityLog(limit);
    }

    @GetMapping("/audit-log/{id}")
    public ActivityLogResponse auditLogEntry(@PathVariable UUID id) {
        return partnerService.getMyActivityLogEntry(id);
    }

    @GetMapping("/security-settings")
    public PartnerSecuritySettingsResponse securitySettings() {
        return partnerService.getMySecuritySettings();
    }

    @PutMapping("/security-settings")
    public PartnerSecuritySettingsResponse updateSecuritySettings(@Valid @RequestBody UpdatePartnerSecuritySettingsRequest request) {
        return partnerService.updateMySecuritySettings(request);
    }
}
