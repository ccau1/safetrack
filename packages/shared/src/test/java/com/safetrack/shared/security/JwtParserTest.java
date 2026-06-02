package com.safetrack.shared.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtParserTest {

    private static final String SECRET = "my-super-secret-key-that-is-long-enough-for-hs256-algorithm";
    private JwtProperties jwtProperties;
    private JwtParser jwtParser;
    private SecretKey key;

    @BeforeEach
    void setUp() {
        jwtProperties = mock(JwtProperties.class);
        when(jwtProperties.getSecret()).thenReturn(SECRET);
        jwtParser = new JwtParser(jwtProperties);
        key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
    }

    private String generateToken(UUID userId, String email, String roles, String orgId, String actions, long expirationOffsetMs) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationOffsetMs);
        var builder = Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key);
        if (orgId != null) {
            builder.claim("org_id", orgId);
        }
        if (actions != null) {
            builder.claim("actions", actions);
        }
        return builder.compact();
    }

    @Test
    void extractUserId_shouldReturnUserId() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "USER", null, null, 60000);
        assertEquals(userId, jwtParser.extractUserId(token));
    }

    @Test
    void extractEmail_shouldReturnEmail() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "USER", null, null, 60000);
        assertEquals("test@example.com", jwtParser.extractEmail(token));
    }

    @Test
    void extractRoles_shouldReturnRoles() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "ADMIN,MANAGER", null, null, 60000);
        assertEquals("ADMIN,MANAGER", jwtParser.extractRoles(token));
    }

    @Test
    void extractOrganizationId_shouldReturnOrganizationId() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "USER", orgId.toString(), null, 60000);
        assertEquals(orgId, jwtParser.extractOrganizationId(token));
    }

    @Test
    void extractOrganizationId_shouldReturnNull_whenNotPresent() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "USER", null, null, 60000);
        assertNull(jwtParser.extractOrganizationId(token));
    }

    @Test
    void extractActions_shouldReturnActionsSet() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "USER", null, "read,write,delete", 60000);
        Set<String> actions = jwtParser.extractActions(token);
        assertEquals(Set.of("read", "write", "delete"), actions);
    }

    @Test
    void extractActions_shouldReturnEmptySet_whenNotPresent() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "USER", null, null, 60000);
        assertEquals(Set.of(), jwtParser.extractActions(token));
    }

    @Test
    void extractActions_shouldReturnEmptySet_whenBlank() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "USER", null, "   ", 60000);
        assertEquals(Set.of(), jwtParser.extractActions(token));
    }

    @Test
    void isTokenValid_shouldReturnTrue_forValidToken() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "USER", null, null, 60000);
        assertTrue(jwtParser.isTokenValid(token));
    }

    @Test
    void isTokenValid_shouldReturnFalse_forExpiredToken() {
        UUID userId = UUID.randomUUID();
        String token = generateToken(userId, "test@example.com", "USER", null, null, -1000);
        assertFalse(jwtParser.isTokenValid(token));
    }

    @Test
    void isTokenValid_shouldReturnFalse_forInvalidToken() {
        assertFalse(jwtParser.isTokenValid("invalid-token"));
    }

    @Test
    void parseToken_shouldThrowException_forMalformedToken() {
        assertThrows(Exception.class, () -> jwtParser.parseToken("not-a-jwt"));
    }
}
