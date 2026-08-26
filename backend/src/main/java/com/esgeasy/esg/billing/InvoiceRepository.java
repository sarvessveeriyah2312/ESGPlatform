package com.esgeasy.esg.billing;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {
    List<Invoice> findByCompanyId(UUID companyId);
    Page<Invoice> findByCompanyIdOrderByDueDateDesc(UUID companyId, Pageable pageable);
    Optional<Invoice> findByStripeInvoiceId(String stripeInvoiceId);
}
