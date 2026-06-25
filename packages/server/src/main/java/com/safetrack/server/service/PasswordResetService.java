package com.safetrack.server.service;

import com.safetrack.server.domain.entity.PasswordResetToken;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.PasswordResetTokenRepository;
import com.safetrack.server.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final PasswordResetTokenRepository tokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.password-reset.expiration-ms:7200000}")
    private long expirationMs;

    @Transactional
    public PasswordResetResult requestReset(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return PasswordResetResult.EMAIL_SENT;
        }

        User user = userOpt.get();
        if (user.getPasswordHash() == null) {
            return PasswordResetResult.SSO_ONLY;
        }

        // Invalidate any existing non-used tokens for this user
        tokenRepository.findByUserIdAndUsedFalseAndExpiresAtAfter(user.getId(), Instant.now())
                .forEach(t -> {
                    t.setUsed(true);
                    tokenRepository.save(t);
                });

        String rawToken = UUID.randomUUID() + "-" + UUID.randomUUID();
        String tokenHash = hashToken(rawToken);

        PasswordResetToken token = PasswordResetToken.builder()
                .tokenHash(tokenHash)
                .user(user)
                .expiresAt(Instant.now().plusMillis(expirationMs))
                .used(false)
                .build();
        tokenRepository.save(token);

        emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        return PasswordResetResult.EMAIL_SENT;
    }

    @Transactional(readOnly = true)
    public User validateToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        PasswordResetToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired reset token"));

        if (Boolean.TRUE.equals(token.getUsed()) || token.getExpiresAt().isBefore(Instant.now())) {
            throw new BadCredentialsException("Invalid or expired reset token");
        }

        return token.getUser();
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String tokenHash = hashToken(rawToken);
        PasswordResetToken token = tokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new BadCredentialsException("Invalid or expired reset token"));

        if (Boolean.TRUE.equals(token.getUsed()) || token.getExpiresAt().isBefore(Instant.now())) {
            throw new BadCredentialsException("Invalid or expired reset token");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        token.setUsed(true);
        tokenRepository.save(token);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    public enum PasswordResetResult {
        EMAIL_SENT,
        SSO_ONLY
    }
}
