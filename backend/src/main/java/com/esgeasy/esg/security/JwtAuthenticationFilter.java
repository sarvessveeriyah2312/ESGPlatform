package com.esgeasy.esg.security;

import com.esgeasy.esg.session.UserSession;
import com.esgeasy.esg.session.UserSessionRepository;
import com.esgeasy.esg.tenant.Partner;
import com.esgeasy.esg.tenant.PartnerRepository;
import com.esgeasy.esg.user.AppUser;
import com.esgeasy.esg.user.AppUserRepository;
import jakarta.persistence.EntityManager;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.hibernate.Session;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/**
 * Validates the bearer JWT, loads the current {@link AppUser} to confirm the token's
 * tokenVersion still matches (cheap session-invalidation without refresh-token infrastructure),
 * populates the {@link SecurityContextHolder}, and enables the Hibernate {@code companyFilter}
 * on the request-bound persistence context as the data-access-layer tenant-isolation safety net
 * (requires {@code spring.jpa.open-in-view=true} so the same session spans the whole request).
 *
 * Also checks the token's jti against user_session for granular per-device revocation. Tokens
 * minted before this check existed carry no jti claim; those are let through on tokenVersion+active
 * alone (their own natural expiry retires this fallback within one token lifetime of deploy).
 *
 * Also re-checks the partner-subdomain boundary on every request, not just at login. A partner's
 * subdomain is a login boundary (AuthService.requireDomainMatch), but that check only fires when
 * a password is actually submitted — it does nothing
 * for a token that was already issued (on the bare domain, on a different partner's subdomain, or
 * before the login check existed) and is simply still sitting, unexpired, in that origin's
 * localStorage. The frontend sends the subdomain it's being viewed from as X-Partner-Slug
 * (api/client.ts); if that resolves to a real partner the token's user doesn't belong to, the
 * request is treated as unauthenticated rather than trusting the token.
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Duration LAST_SEEN_UPDATE_INTERVAL = Duration.ofMinutes(5);
    private static final String PARTNER_SLUG_HEADER = "X-Partner-Slug";

    private final JwtService jwtService;
    private final AppUserRepository appUserRepository;
    private final UserSessionRepository userSessionRepository;
    private final EntityManager entityManager;
    private final PartnerRepository partnerRepository;

    public JwtAuthenticationFilter(JwtService jwtService, AppUserRepository appUserRepository,
                                    UserSessionRepository userSessionRepository, EntityManager entityManager,
                                    PartnerRepository partnerRepository) {
        this.jwtService = jwtService;
        this.appUserRepository = appUserRepository;
        this.userSessionRepository = userSessionRepository;
        this.entityManager = entityManager;
        this.partnerRepository = partnerRepository;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                     @NonNull HttpServletResponse response,
                                     @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            Optional<JwtService.DecodedToken> decoded = jwtService.parse(token);

            if (decoded.isPresent()) {
                JwtService.DecodedToken d = decoded.get();
                Optional<AppUser> userOpt = appUserRepository.findById(d.userId());

                if (userOpt.isPresent()) {
                    AppUser user = userOpt.get();
                    boolean versionMatches = user.getTokenVersion().equals(d.tokenVersion());

                    if (versionMatches && Boolean.TRUE.equals(user.getActive()) && sessionValid(d)
                            && belongsOnRequestedDomain(user, request)) {
                        var companyId = user.getCompany() != null ? user.getCompany().getId() : null;
                        var partnerId = user.getPartner() != null ? user.getPartner().getId() : null;
                        var principal = new EsgEasyPrincipal(user.getId(), companyId, partnerId, user.getRole(), user.getEmail(), java.util.Set.of(), d.jti());

                        var authorities = java.util.List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
                        var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
                        SecurityContextHolder.getContext().setAuthentication(authentication);

                        if (companyId != null) {
                            Session session = entityManager.unwrap(Session.class);
                            if (session.getFactory().getDefinedFilterNames().contains("companyFilter")) {
                                session.enableFilter("companyFilter").setParameter("companyId", companyId);
                            }
                        }
                    }
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Mirrors AuthService.requireDomainMatch's fallback posture exactly: no header, or a slug
     * that doesn't resolve to any known partner, means no restriction (an unrecognized subdomain
     * isn't a real boundary — same graceful-fallback the brand-lookup endpoint already has).
     * Only an actual partner mismatch rejects the request.
     */
    private boolean belongsOnRequestedDomain(AppUser user, HttpServletRequest request) {
        String slug = request.getHeader(PARTNER_SLUG_HEADER);
        if (slug == null || slug.isBlank()) {
            return true;
        }
        Partner partner = partnerRepository.findBySubdomainSlug(slug).orElse(null);
        if (partner == null) {
            return true;
        }
        var userPartnerId = user.getEffectivePartnerId();
        return userPartnerId != null && userPartnerId.equals(partner.getId());
    }

    private boolean sessionValid(JwtService.DecodedToken d) {
        if (d.jti() == null) {
            return true;
        }
        Optional<UserSession> sessionOpt = userSessionRepository.findByJti(d.jti().toString());
        if (sessionOpt.isEmpty()) {
            return false;
        }
        UserSession session = sessionOpt.get();
        boolean valid = session.getRevokedAt() == null && session.getExpiresAt().isAfter(Instant.now());
        if (valid && Duration.between(session.getLastSeenAt(), Instant.now()).compareTo(LAST_SEEN_UPDATE_INTERVAL) >= 0) {
            session.setLastSeenAt(Instant.now());
            userSessionRepository.save(session);
        }
        return valid;
    }
}
