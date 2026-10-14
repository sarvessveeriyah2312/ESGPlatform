package com.esgeasy.esg.tenant;

import com.esgeasy.esg.tenant.dto.CreatePartnerAdminUserRequest;
import com.esgeasy.esg.tenant.dto.CreatePartnerAdminUserResponse;
import com.esgeasy.esg.tenant.dto.PartnerResponse;
import com.esgeasy.esg.tenant.dto.SavePartnerRequest;
import com.esgeasy.esg.tenant.dto.StripeConnectLinkResponse;
import com.esgeasy.esg.tenant.dto.StripeConnectStatusResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/** Platform-admin-only white-label partner CRUD — see PartnerService. */
@RestController
@RequestMapping("/api/v1/admin/partners")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN', 'SUPERADMIN')")
public class PartnerController {

    private final PartnerService partnerService;

    public PartnerController(PartnerService partnerService) {
        this.partnerService = partnerService;
    }

    @GetMapping
    public List<PartnerResponse> list() {
        return partnerService.list();
    }

    @PostMapping
    public PartnerResponse create(@Valid @RequestBody SavePartnerRequest request) {
        return partnerService.create(request);
    }

    @PutMapping("/{id}")
    public PartnerResponse update(@PathVariable UUID id, @Valid @RequestBody SavePartnerRequest request) {
        return partnerService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        partnerService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Creates the partner's own login — no partner self-service yet, so this is the only way one gets created. */
    @PostMapping("/{id}/users")
    public CreatePartnerAdminUserResponse createUser(@PathVariable UUID id, @Valid @RequestBody CreatePartnerAdminUserRequest request) {
        return partnerService.createPartnerAdminUser(id, request);
    }

    /** Starts (or resumes) Stripe Connect Express onboarding for this partner. */
    @PostMapping("/{id}/stripe-connect/link")
    public StripeConnectLinkResponse startStripeConnectOnboarding(@PathVariable UUID id) {
        return partnerService.startStripeConnectOnboarding(id);
    }

    @GetMapping("/{id}/stripe-connect/status")
    public StripeConnectStatusResponse getStripeConnectStatus(@PathVariable UUID id) {
        return partnerService.getStripeConnectStatus(id);
    }
}
