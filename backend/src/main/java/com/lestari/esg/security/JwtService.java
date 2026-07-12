package com.lestari.esg.security;

import com.lestari.esg.user.AppUser;
import com.lestari.esg.user.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;
import java.util.UUID;

@Service
public class JwtService {

    private final JwtProperties properties;
    private final SecretKey key;

    public JwtService(JwtProperties properties) {
        this.properties = properties;
        this.key = Keys.hmacShaKeyFor(properties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(AppUser user) {
        Instant now = Instant.now();
        Instant expiry = now.plus(Duration.ofMinutes(properties.getExpirationMinutes()));

        var builder = Jwts.builder()
                .subject(user.getId().toString())
                .claim("role", user.getRole().name())
                .claim("tokenVersion", user.getTokenVersion())
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(key);

        if (user.getCompany() != null) {
            builder.claim("companyId", user.getCompany().getId().toString());
        }

        return builder.compact();
    }

    public Optional<DecodedToken> parse(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            UUID userId = UUID.fromString(claims.getSubject());
            UUID companyId = claims.get("companyId", String.class) != null
                    ? UUID.fromString(claims.get("companyId", String.class))
                    : null;
            Role role = Role.valueOf(claims.get("role", String.class));
            int tokenVersion = claims.get("tokenVersion", Integer.class);
            String email = claims.get("email", String.class);

            return Optional.of(new DecodedToken(userId, companyId, role, email, tokenVersion));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public record DecodedToken(UUID userId, UUID companyId, Role role, String email, int tokenVersion) {
    }
}
