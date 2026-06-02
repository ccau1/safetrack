package com.safetrack.server.security;

import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import com.safetrack.shared.security.JwtParser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @Mock
    private JwtParser jwtParser;

    @InjectMocks
    private JwtService jwtService;

    private static final String SECRET = "my-super-secret-key-that-is-long-enough-for-hs256-algorithm";
    private static final long EXPIRATION_MS = 900000;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtService, "jwtSecret", SECRET);
        ReflectionTestUtils.setField(jwtService, "jwtExpirationMs", EXPIRATION_MS);
    }

    @Test
    void generateToken_shouldCreateValidToken() {
        Role role = Role.builder().name(Role.RoleName.USER).build();
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .roles(Set.of(role))
                .build();
        UUID orgId = UUID.randomUUID();

        String token = jwtService.generateToken(user, orgId);

        assertNotNull(token);
        assertTrue(token.split("\\.").length == 3);
    }

    @Test
    void generateToken_shouldCreateTokenWithoutOrgId() {
        Role role = Role.builder().name(Role.RoleName.ADMIN).build();
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("admin@example.com")
                .roles(Set.of(role))
                .build();

        String token = jwtService.generateToken(user, null);

        assertNotNull(token);
    }

    @Test
    void generateToken_shouldIncludeAllRoles() {
        Role userRole = Role.builder().name(Role.RoleName.USER).build();
        Role adminRole = Role.builder().name(Role.RoleName.ADMIN).build();
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .roles(Set.of(userRole, adminRole))
                .build();

        String token = jwtService.generateToken(user, null);

        assertNotNull(token);
    }

    @Test
    void isTokenValid_shouldDelegateToJwtParser() {
        when(jwtParser.isTokenValid("token123")).thenReturn(true);
        assertTrue(jwtService.isTokenValid("token123"));
        verify(jwtParser).isTokenValid("token123");
    }

    @Test
    void extractEmail_shouldDelegateToJwtParser() {
        when(jwtParser.extractEmail("token123")).thenReturn("user@example.com");
        assertEquals("user@example.com", jwtService.extractEmail("token123"));
        verify(jwtParser).extractEmail("token123");
    }

    @Test
    void extractOrganizationId_shouldDelegateToJwtParser() {
        UUID orgId = UUID.randomUUID();
        when(jwtParser.extractOrganizationId("token123")).thenReturn(orgId);
        assertEquals(orgId, jwtService.extractOrganizationId("token123"));
        verify(jwtParser).extractOrganizationId("token123");
    }
}
