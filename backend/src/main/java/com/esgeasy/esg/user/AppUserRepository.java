package com.esgeasy.esg.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<AppUser> findByCompanyId(UUID companyId);
    boolean existsByCustomRoleId(UUID customRoleId);
    long countByCompanyIdAndRoleAndActiveTrue(UUID companyId, Role role);
    /** Backs the partner console (WHITELABEL_PLAN.md Phase 4) and PartnerService's delete-guard. */
    List<AppUser> findByPartnerId(UUID partnerId);
    boolean existsByPartnerId(UUID partnerId);
    List<AppUser> findByPartnerIdOrderByNameAsc(UUID partnerId);
    /** Lockout-prevention for partner logins, mirroring countByCompanyIdAndRoleAndActiveTrue's role — every partner user is PARTNER_ADMIN, so no role param needed. */
    long countByPartnerIdAndActiveTrue(UUID partnerId);
}
