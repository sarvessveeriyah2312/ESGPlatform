package com.esgeasy.esg.tenant;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PartnerRepository extends JpaRepository<Partner, UUID> {
    List<Partner> findAllByOrderByNameAsc();

    /** Backs pre-login subdomain brand resolution — see PublicReferenceController.brand(). */
    Optional<Partner> findBySubdomainSlug(String subdomainSlug);
}
