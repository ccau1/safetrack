package com.safetrack.shared.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Date;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtParser {

    private final JwtProperties jwtProperties;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(String token) {
        String subject = parseToken(token).getSubject();
        return UUID.fromString(subject);
    }

    public String extractEmail(String token) {
        return parseToken(token).get("email", String.class);
    }

    public String extractRoles(String token) {
        return parseToken(token).get("roles", String.class);
    }

    public UUID extractOrganizationId(String token) {
        String orgId = parseToken(token).get("org_id", String.class);
        return orgId != null ? UUID.fromString(orgId) : null;
    }

    public Set<String> extractActions(String token) {
        String actions = parseToken(token).get("actions", String.class);
        if (actions == null || actions.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(actions.split(","))
                .filter(s -> !s.isBlank())
                .collect(Collectors.toSet());
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            log.debug("Invalid JWT token: {}", e.getMessage());
            return false;
        }
    }
}
