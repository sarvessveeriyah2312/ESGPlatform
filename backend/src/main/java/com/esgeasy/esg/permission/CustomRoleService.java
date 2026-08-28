package com.esgeasy.esg.permission;

import com.esgeasy.esg.common.exceptions.ConflictException;
import com.esgeasy.esg.common.exceptions.ForbiddenException;
import com.esgeasy.esg.common.exceptions.NotFoundException;
import com.esgeasy.esg.permission.dto.CreateCustomRoleRequest;
import com.esgeasy.esg.permission.dto.CustomRoleResponse;
import com.esgeasy.esg.permission.dto.UpdateCustomRoleRequest;
import com.esgeasy.esg.security.CurrentUserProvider;
import com.esgeasy.esg.tenant.TeamInviteRepository;
import com.esgeasy.esg.user.AppUser;
import com.esgeasy.esg.user.AppUserRepository;
import com.esgeasy.esg.user.Role;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * CRUD for a company's custom roles — scoped via {@link CurrentUserProvider#requireCompanyId()},
 * the same isolation idiom {@code CompanyService} uses for team/invite management. The
 * {@code custom_role} table also carries the Hibernate {@code companyFilter} (TenantOwnedEntity)
 * as a data-access-layer backstop, so a role can never be read or modified cross-tenant even if
 * one of these explicit checks were ever missed.
 */
@Service
public class CustomRoleService {

    private final CustomRoleRepository customRoleRepository;
    private final PermissionRepository permissionRepository;
    private final AppUserRepository appUserRepository;
    private final TeamInviteRepository teamInviteRepository;
    private final CurrentUserProvider currentUserProvider;

    public CustomRoleService(CustomRoleRepository customRoleRepository, PermissionRepository permissionRepository,
                              AppUserRepository appUserRepository, TeamInviteRepository teamInviteRepository,
                              CurrentUserProvider currentUserProvider) {
        this.customRoleRepository = customRoleRepository;
        this.permissionRepository = permissionRepository;
        this.appUserRepository = appUserRepository;
        this.teamInviteRepository = teamInviteRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public List<CustomRoleResponse> list() {
        UUID companyId = currentUserProvider.requireCompanyId();
        return customRoleRepository.findByCompanyIdOrderByNameAsc(companyId).stream()
                .map(CustomRoleResponse::from)
                .toList();
    }

    @Transactional
    public CustomRoleResponse create(CreateCustomRoleRequest request) {
        UUID companyId = currentUserProvider.requireCompanyId();
        if (customRoleRepository.findByCompanyIdAndNameIgnoreCase(companyId, request.name()).isPresent()) {
            throw new ConflictException("A role named \"" + request.name() + "\" already exists");
        }

        CustomRole role = new CustomRole();
        role.setCompanyId(companyId);
        role.setName(request.name());
        role.setDescription(request.description());
        role.setPermissionKeys(validatedKeys(request.permissionKeys()));

        return CustomRoleResponse.from(customRoleRepository.save(role));
    }

    @Transactional
    public CustomRoleResponse update(UUID roleId, UpdateCustomRoleRequest request) {
        CustomRole role = requireOwnedRole(roleId);

        customRoleRepository.findByCompanyIdAndNameIgnoreCase(role.getCompanyId(), request.name())
                .filter(existing -> !existing.getId().equals(roleId))
                .ifPresent(existing -> {
                    throw new ConflictException("A role named \"" + request.name() + "\" already exists");
                });

        role.setName(request.name());
        role.setDescription(request.description());
        role.setPermissionKeys(validatedKeys(request.permissionKeys()));

        return CustomRoleResponse.from(customRoleRepository.save(role));
    }

    @Transactional
    public void delete(UUID roleId) {
        CustomRole role = requireOwnedRole(roleId);
        if (appUserRepository.existsByCustomRoleId(roleId)
                || teamInviteRepository.existsByCustomRoleIdAndAcceptedAtIsNullAndRevokedAtIsNull(roleId)) {
            throw new ConflictException("Cannot delete \"" + role.getName() + "\" — reassign the users and pending "
                    + "invites still on this role first");
        }
        customRoleRepository.delete(role);
    }

    /** Resolves a role ID against the caller's own company — used by CompanyService when validating a customRoleId to assign. */
    public CustomRole requireOwnedRole(UUID roleId) {
        CustomRole role = customRoleRepository.findById(roleId)
                .orElseThrow(() -> new NotFoundException("Role not found"));
        UUID companyId = currentUserProvider.requireCompanyId();
        if (!companyId.equals(role.getCompanyId())) {
            throw new NotFoundException("Role not found");
        }
        return role;
    }

    private List<String> validatedKeys(List<String> requestedKeys) {
        if (requestedKeys == null || requestedKeys.isEmpty()) {
            return List.of();
        }
        Set<String> knownKeys = Set.copyOf(permissionRepository.findAllKeys());
        List<String> unknown = requestedKeys.stream().filter(k -> !knownKeys.contains(k)).toList();
        if (!unknown.isEmpty()) {
            throw new IllegalArgumentException("Unknown permission key(s): " + unknown);
        }

        // Privilege-escalation guard: a role can never grant more than its creator/editor already
        // holds — otherwise a user delegated only 'roles.manage' could mint a role with every
        // permission that exists (e.g. billing.manage) and hand it to another account. COMPANY_ADMIN
        // is exempt since it implicitly holds every permission (see PermissionGateService).
        if (currentUserProvider.getPrincipal().role() != Role.COMPANY_ADMIN) {
            Set<String> callerKeys = callerPermissionKeys();
            List<String> notHeld = requestedKeys.stream().filter(k -> !callerKeys.contains(k)).toList();
            if (!notHeld.isEmpty()) {
                throw new ForbiddenException("Cannot grant permission(s) you don't hold yourself: " + notHeld);
            }
        }

        return List.copyOf(Set.copyOf(requestedKeys));
    }

    private Set<String> callerPermissionKeys() {
        AppUser user = appUserRepository.findById(currentUserProvider.getPrincipal().userId()).orElse(null);
        if (user == null || user.getCustomRole() == null) {
            return Set.of();
        }
        return Set.copyOf(user.getCustomRole().getPermissionKeys());
    }
}
