package com.esgeasy.esg.tenant;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {
    List<Company> findByParentCompanyId(UUID parentCompanyId);
    Optional<Company> findByStripeCustomerId(String stripeCustomerId);
    boolean existsByPartnerId(UUID partnerId);
    /** Backs the partner console (WHITELABEL_PLAN.md Phase 4) — a partner's own scoped view of its companies. */
    List<Company> findByPartnerIdOrderByNameAsc(UUID partnerId);

    /**
     * Row-locking read for the checkout-confirmation critical section — two browser tabs (or a
     * dev-mode double-effect) confirming the same session concurrently must serialize rather than
     * race, or the loser's stale in-memory read can silently overwrite the winner's just-saved
     * stripeCustomerId/stripeSubscriptionId with nulls. See CompanyBillingService.confirmCheckout.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Company c where c.id = :id")
    Optional<Company> findByIdForUpdate(@Param("id") UUID id);
}
