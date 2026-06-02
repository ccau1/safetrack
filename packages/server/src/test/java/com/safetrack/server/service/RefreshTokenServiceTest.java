package com.safetrack.server.service;

import com.safetrack.server.domain.entity.RefreshToken;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.RefreshTokenRepository;
import com.safetrack.server.domain.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(refreshTokenService, "refreshExpirationMs", 604800000L);
    }

    @Test
    void createRefreshToken_shouldRevokeExistingAndCreateNew() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).build();
        RefreshToken existing = RefreshToken.builder().id(UUID.randomUUID()).revoked(false).build();

        when(refreshTokenRepository.findAllByUserIdAndRevokedFalse(userId)).thenReturn(List.of(existing));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        String token = refreshTokenService.createRefreshToken(userId);

        assertNotNull(token);
        assertTrue(existing.getRevoked());
        verify(refreshTokenRepository).saveAll(anyList());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void createRefreshToken_shouldThrow_whenUserNotFound() {
        UUID userId = UUID.randomUUID();
        when(refreshTokenRepository.findAllByUserIdAndRevokedFalse(userId)).thenReturn(List.of());
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> refreshTokenService.createRefreshToken(userId));
    }

    @Test
    void validateRefreshToken_shouldReturnUser_whenValid() {
        String rawToken = UUID.randomUUID() + "-" + UUID.randomUUID();
        User user = User.builder().id(UUID.randomUUID()).build();
        RefreshToken rt = RefreshToken.builder()
                .id(UUID.randomUUID())
                .tokenHash(hash(rawToken))
                .user(user)
                .revoked(false)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByTokenHash(rt.getTokenHash())).thenReturn(Optional.of(rt));

        User result = refreshTokenService.validateRefreshToken(rawToken);
        assertEquals(user, result);
    }

    @Test
    void validateRefreshToken_shouldThrow_whenTokenNotFound() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validateRefreshToken("invalid"));
    }

    @Test
    void validateRefreshToken_shouldThrow_whenRevoked() {
        String rawToken = UUID.randomUUID() + "-" + UUID.randomUUID();
        RefreshToken rt = RefreshToken.builder()
                .tokenHash(hash(rawToken))
                .revoked(true)
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByTokenHash(rt.getTokenHash())).thenReturn(Optional.of(rt));

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validateRefreshToken(rawToken));
    }

    @Test
    void validateRefreshToken_shouldThrow_whenExpired() {
        String rawToken = UUID.randomUUID() + "-" + UUID.randomUUID();
        RefreshToken rt = RefreshToken.builder()
                .tokenHash(hash(rawToken))
                .revoked(false)
                .expiresAt(Instant.now().minusSeconds(3600))
                .build();

        when(refreshTokenRepository.findByTokenHash(rt.getTokenHash())).thenReturn(Optional.of(rt));

        assertThrows(BadCredentialsException.class, () -> refreshTokenService.validateRefreshToken(rawToken));
    }

    @Test
    void revokeRefreshToken_shouldRevokeToken() {
        String rawToken = UUID.randomUUID() + "-" + UUID.randomUUID();
        RefreshToken rt = RefreshToken.builder()
                .id(UUID.randomUUID())
                .tokenHash(hash(rawToken))
                .revoked(false)
                .build();

        when(refreshTokenRepository.findByTokenHash(rt.getTokenHash())).thenReturn(Optional.of(rt));
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(i -> i.getArgument(0));

        refreshTokenService.revokeRefreshToken(rawToken);
        assertTrue(rt.getRevoked());
    }

    @Test
    void revokeRefreshToken_shouldDoNothing_whenTokenNotFound() {
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        refreshTokenService.revokeRefreshToken("missing");
        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void revokeAllForUser_shouldRevokeAllTokens() {
        UUID userId = UUID.randomUUID();
        RefreshToken t1 = RefreshToken.builder().id(UUID.randomUUID()).revoked(false).build();
        RefreshToken t2 = RefreshToken.builder().id(UUID.randomUUID()).revoked(false).build();

        when(refreshTokenRepository.findAllByUserIdAndRevokedFalse(userId)).thenReturn(List.of(t1, t2));
        when(refreshTokenRepository.saveAll(anyList())).thenAnswer(i -> i.getArgument(0));

        refreshTokenService.revokeAllForUser(userId);

        assertTrue(t1.getRevoked());
        assertTrue(t2.getRevoked());
    }

    private String hash(String token) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
