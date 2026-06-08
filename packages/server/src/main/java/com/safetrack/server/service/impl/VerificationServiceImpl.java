package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.VerificationChallenge;
import com.safetrack.server.domain.repository.ContactPointRepository;
import com.safetrack.server.domain.repository.UserRepository;
import com.safetrack.server.domain.repository.VerificationChallengeRepository;
import com.safetrack.server.service.VerificationChannel;
import com.safetrack.server.service.VerificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VerificationServiceImpl implements VerificationService {

    private final VerificationChallengeRepository challengeRepository;
    private final ContactPointRepository contactPointRepository;
    private final UserRepository userRepository;
    private final List<VerificationChannel> channels;

    @Value("${app.verification.link-expiry-minutes:1440}")
    private int linkExpiryMinutes;

    @Value("${app.verification.code-expiry-minutes:15}")
    private int codeExpiryMinutes;

    @Value("${app.verification.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.verification.max-pending-per-hour:3}")
    private int maxPendingPerHour;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();
    private static final int TOKEN_BYTES = 32;
    private static final int CODE_LENGTH = 6;

    @Override
    @Transactional
    public VerificationChallenge initiateVerification(UUID contactPointId, VerificationChallenge.Method method) {
        ContactPoint contactPoint = contactPointRepository.findById(contactPointId)
                .orElseThrow(() -> new IllegalArgumentException("Contact point not found"));

        if (contactPoint.isVerified()) {
            throw new IllegalStateException("Contact point is already verified");
        }

        checkRateLimit(contactPointId);

        challengeRepository.cancelPendingByContactPointId(contactPointId);

        String rawSecret = generateSecret(method);
        String hash = sha256(rawSecret);

        Instant expiresAt = method == VerificationChallenge.Method.EMAIL_LINK
                ? Instant.now().plus(linkExpiryMinutes, ChronoUnit.MINUTES)
                : Instant.now().plus(codeExpiryMinutes, ChronoUnit.MINUTES);

        VerificationChallenge challenge = VerificationChallenge.builder()
                .contactPoint(contactPoint)
                .method(method)
                .purpose(VerificationChallenge.Purpose.VERIFY_CONTACT)
                .status(VerificationChallenge.Status.PENDING)
                .expiresAt(expiresAt)
                .build();

        if (method == VerificationChallenge.Method.EMAIL_LINK) {
            challenge.setTokenHash(hash);
        } else {
            challenge.setCodeHash(hash);
        }

        VerificationChallenge saved = challengeRepository.save(challenge);

        dispatch(contactPoint, rawSecret, method);

        log.info("Verification initiated for contact point {} via {}", contactPointId, method);
        return saved;
    }

    @Override
    @Transactional
    public ContactPoint verifyByToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Token is required");
        }

        String hash = sha256(rawToken);
        VerificationChallenge challenge = challengeRepository.findByTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired token"));

        return processVerification(challenge, null);
    }

    @Override
    @Transactional
    public ContactPoint verifyByCode(UUID contactPointId, String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            throw new IllegalArgumentException("Code is required");
        }

        List<VerificationChallenge> pending = challengeRepository.findByContactPointIdAndStatus(
                contactPointId, VerificationChallenge.Status.PENDING);

        if (pending.isEmpty()) {
            throw new IllegalArgumentException("No pending verification found for this contact point");
        }

        String hash = sha256(rawCode);
        VerificationChallenge challenge = pending.stream()
                .filter(c -> hash.equals(c.getCodeHash()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Invalid code"));

        return processVerification(challenge, rawCode);
    }

    @Override
    @Transactional
    public void resendVerification(UUID contactPointId, VerificationChallenge.Method method) {
        ContactPoint contactPoint = contactPointRepository.findById(contactPointId)
                .orElseThrow(() -> new IllegalArgumentException("Contact point not found"));

        if (contactPoint.isVerified()) {
            throw new IllegalStateException("Contact point is already verified");
        }

        checkRateLimit(contactPointId);
        initiateVerification(contactPointId, method);
    }

    private ContactPoint processVerification(VerificationChallenge challenge, String rawInputForLogging) {
        if (!challenge.isPending()) {
            throw new IllegalArgumentException("Challenge is not pending");
        }

        if (challenge.isExpired()) {
            challenge.markExpired();
            challengeRepository.save(challenge);
            throw new IllegalArgumentException("Verification has expired");
        }

        if (!challenge.canAttempt(maxAttempts)) {
            challenge.markExpired();
            challengeRepository.save(challenge);
            throw new IllegalArgumentException("Too many failed attempts. Please request a new verification.");
        }

        challenge.recordAttempt();

        challenge.markVerified();
        challengeRepository.save(challenge);

        ContactPoint contactPoint = challenge.getContactPoint();
        contactPoint.setVerifiedAt(Instant.now());
        contactPointRepository.save(contactPoint);

        if (contactPoint.getType() == ContactPoint.ContactPointType.EMAIL) {
            User user = contactPoint.getUser();
            if (user.getEmail() != null && user.getEmail().equalsIgnoreCase(contactPoint.getValue())) {
                user.setEmailVerifiedAt(Instant.now());
                userRepository.save(user);
            }
        }

        log.info("Contact point {} verified successfully", contactPoint.getId());
        return contactPoint;
    }

    private void checkRateLimit(UUID contactPointId) {
        Instant oneHourAgo = Instant.now().minus(1, ChronoUnit.HOURS);
        long pendingCount = challengeRepository.countPendingByContactPointIdSince(contactPointId, oneHourAgo);
        if (pendingCount >= maxPendingPerHour) {
            throw new IllegalStateException("Too many verification attempts. Please try again later.");
        }
    }

    private void dispatch(ContactPoint contactPoint, String rawSecret, VerificationChallenge.Method method) {
        for (VerificationChannel channel : channels) {
            if (channel.supports(method)) {
                channel.dispatch(contactPoint, rawSecret, method);
                return;
            }
        }
        throw new IllegalStateException("No channel available for method: " + method);
    }

    private String generateSecret(VerificationChallenge.Method method) {
        if (method == VerificationChallenge.Method.EMAIL_LINK) {
            byte[] bytes = new byte[TOKEN_BYTES];
            SECURE_RANDOM.nextBytes(bytes);
            return HexFormat.of().formatHex(bytes);
        }

        int code = SECURE_RANDOM.nextInt(1_000_000);
        return String.format("%06d", code);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
