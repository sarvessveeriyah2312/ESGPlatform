package com.lestari.esg.tenant;

import com.lestari.esg.security.CurrentUserProvider;
import com.lestari.esg.tenant.dto.CompanyResponse;
import com.lestari.esg.tenant.dto.CreateTenantUserRequest;
import com.lestari.esg.tenant.dto.CreateTenantUserResponse;
import com.lestari.esg.tenant.dto.TeamInviteResponse;
import com.lestari.esg.tenant.dto.TenantUserResponse;
import com.lestari.esg.tenant.dto.UpdateCompanyProfileRequest;
import com.lestari.esg.tenant.dto.UpdatePlanRequest;
import com.lestari.esg.tenant.dto.UpdateUserRoleRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/company")
public class CompanyController {

    private final CompanyService companyService;
    private final CurrentUserProvider currentUserProvider;

    public CompanyController(CompanyService companyService, CurrentUserProvider currentUserProvider) {
        this.companyService = companyService;
        this.currentUserProvider = currentUserProvider;
    }

    @GetMapping
    public CompanyResponse get() {
        return companyService.getCurrent();
    }

    /** Real company user list — used e.g. to populate an "Authorizing Officer" picker on indicator entries. */
    @GetMapping("/users")
    public List<TenantUserResponse> listUsers() {
        return companyService.listTenantUsers(currentUserProvider.requireCompanyId());
    }

    @PatchMapping("/plan")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public CompanyResponse updatePlan(@Valid @RequestBody UpdatePlanRequest request) {
        return companyService.updatePlan(request);
    }

    @PatchMapping("/profile")
    public CompanyResponse updateProfile(@Valid @RequestBody UpdateCompanyProfileRequest request) {
        return companyService.updateProfile(request);
    }

    @PostMapping("/users")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public CreateTenantUserResponse createUser(@Valid @RequestBody CreateTenantUserRequest request) {
        return companyService.createUser(request);
    }

    @PatchMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public TenantUserResponse updateUserRole(@PathVariable UUID userId, @Valid @RequestBody UpdateUserRoleRequest request) {
        return companyService.updateUserRole(userId, request);
    }

    @PatchMapping("/users/{userId}/active")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public TenantUserResponse setUserActive(@PathVariable UUID userId, @RequestParam boolean active) {
        return companyService.setUserActive(userId, active);
    }

    @GetMapping("/invites")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public List<TeamInviteResponse> listInvites() {
        return companyService.listInvites();
    }

    @PostMapping("/invites")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public TeamInviteResponse createInvite(@Valid @RequestBody CreateTenantUserRequest request) {
        return companyService.createInvite(request);
    }

    @PostMapping("/invites/{inviteId}/resend")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public TeamInviteResponse resendInvite(@PathVariable UUID inviteId) {
        return companyService.resendInvite(inviteId);
    }

    @DeleteMapping("/invites/{inviteId}")
    @PreAuthorize("hasRole('COMPANY_ADMIN')")
    public ResponseEntity<Void> revokeInvite(@PathVariable UUID inviteId) {
        companyService.revokeInvite(inviteId);
        return ResponseEntity.noContent().build();
    }
}
