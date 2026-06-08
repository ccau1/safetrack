package com.safetrack.server.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "verification_challenges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_point_id", nullable = false)
    private ContactPoint contactPoint;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Purpose purpose = Purpose.VERIFY_CONTACT;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private Method method;

    @Column(name = "token_hash", length = 64)
    private String tokenHash;

    @Column(name = "code_hash", length = 64)
    private String codeHash;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isPending() {
        return status == Status.PENDING;
    }

    public boolean canAttempt(int maxAttempts) {
        return isPending() && !isExpired() && attemptCount < maxAttempts;
    }

    public void recordAttempt() {
        this.attemptCount = this.attemptCount + 1;
    }

    public void markVerified() {
        this.status = Status.VERIFIED;
        this.verifiedAt = Instant.now();
    }

    public void markExpired() {
        this.status = Status.EXPIRED;
    }

    public void markCancelled() {
        this.status = Status.CANCELLED;
    }

    public enum Purpose {
        VERIFY_CONTACT, PASSWORD_RESET
    }

    public enum Method {
        EMAIL_LINK, EMAIL_CODE, SMS_CODE, WHATSAPP_CODE
    }

    public enum Status {
        PENDING, VERIFIED, EXPIRED, CANCELLED
    }
}
