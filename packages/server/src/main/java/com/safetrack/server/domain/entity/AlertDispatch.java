package com.safetrack.server.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alert_dispatches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertDispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "emergency_event_id")
    private EmergencyEvent emergencyEvent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalation_rule_step_id")
    private EscalationRuleStep escalationRuleStep;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_point_id")
    private ContactPoint contactPoint;

    @Column(length = 20)
    @Enumerated(EnumType.STRING)
    private ContactPoint.ContactPointType channel;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.SENT;

    @Column(name = "response_value", length = 50)
    private String responseValue;

    @Column(name = "twilio_sid", length = 100)
    private String twilioSid;

    @Column(name = "dispatched_at", nullable = false)
    @Builder.Default
    private Instant dispatchedAt = Instant.now();

    @Column(name = "responded_at")
    private Instant respondedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public boolean isPendingResponse() {
        return status == Status.SENT || status == Status.DELIVERED;
    }

    public void markReplied(String value) {
        this.status = Status.REPLIED;
        this.responseValue = value;
        this.respondedAt = Instant.now();
    }

    public void markNoResponse() {
        this.status = Status.NO_RESPONSE;
    }

    public void markFailed() {
        this.status = Status.FAILED;
    }

    public void markDelivered() {
        this.status = Status.DELIVERED;
    }

    public enum Status {
        SENT, DELIVERED, FAILED, REPLIED, NO_RESPONSE
    }
}
