package com.esgeasy.esg.user;

import com.esgeasy.esg.common.BaseEntity;
import com.esgeasy.esg.permission.CustomRole;
import com.esgeasy.esg.tenant.Company;
import com.esgeasy.esg.tenant.Partner;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

/**
 * Not a {@link com.esgeasy.esg.common.TenantOwnedEntity} — login must look up a user by email
 * before any company context (and therefore the companyFilter) exists.
 */
@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
public class AppUser extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    /** Set only for a PARTNER_ADMIN user (whose company is always null) — see Role.PARTNER_ADMIN. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id")
    private Partner partner;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Role role;

    /**
     * Required for every non-{@code COMPANY_ADMIN} tenant user (enforced in CompanyService, not
     * a DB constraint) — the sole source of what a member can do, since custom roles fully
     * replace any implicit COMPANY_CONTRIBUTOR/CONSULTANT permission set. COMPANY_ADMIN never
     * has one: it implicitly passes every permission check (see PermissionGateService).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "custom_role_id")
    private CustomRole customRole;

    @Column(name = "token_version", nullable = false)
    private Integer tokenVersion = 0;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(length = 50)
    private String phone;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "avatar_path", length = 500)
    private String avatarPath;

    @Column(name = "avatar_original_name", length = 255)
    private String avatarOriginalName;

    @Column(name = "email_verified", nullable = false)
    private Boolean emailVerified = true;

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    /**
     * A PARTNER_ADMIN belongs directly; a tenant user belongs via their company's own partner
     * link; platform-level roles (no company, no partner) always return null. Single resolution
     * point reused by both AuthService.requireDomainMatch (login-time) and
     * JwtAuthenticationFilter (every subsequent request).
     */
    public java.util.UUID getEffectivePartnerId() {
        if (partner != null) {
            return partner.getId();
        }
        if (company != null && company.getPartner() != null) {
            return company.getPartner().getId();
        }
        return null;
    }
}
