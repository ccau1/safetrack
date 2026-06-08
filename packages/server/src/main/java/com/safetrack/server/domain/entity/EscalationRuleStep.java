package com.safetrack.server.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "escalation_rule_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EscalationRuleStep {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "escalation_rule_id", nullable = false)
    private EscalationRule escalationRule;

    @Column(name = "step_order", nullable = false)
    private Integer stepOrder;

    @Column(name = "action_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ActionType actionType;

    @Column(name = "contact_point_type", length = 20)
    @Enumerated(EnumType.STRING)
    private ContactPoint.ContactPointType contactPointType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_point_id")
    private ContactPoint contactPoint;

    @Column(name = "wait_duration_minutes", nullable = false)
    @Builder.Default
    private Integer waitDurationMinutes = 5;

    @Column(name = "message_template", columnDefinition = "TEXT")
    private String messageTemplate;

    @Column(name = "voice_call", nullable = false)
    @Builder.Default
    private Boolean voiceCall = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public enum ActionType {
        CONTACT_POINT, NOTIFY_SUPERVISOR, NOTIFY_EMERGENCY_CONTACT
    }
}
