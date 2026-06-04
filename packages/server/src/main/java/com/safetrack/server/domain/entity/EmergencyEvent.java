package com.safetrack.server.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "emergency_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private Member createdBy;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EmergencyEventType type = EmergencyEventType.EMERGENCY;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private EmergencyEventStatus status = EmergencyEventStatus.ACTIVE;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;

    @OneToMany(mappedBy = "emergencyEvent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MemberEmergencyStatusReport> memberEmergencyStatusReports = new ArrayList<>();

    @OneToMany(mappedBy = "emergencyEvent", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    @OrderBy("createdAt DESC")
    private List<EmergencyEventUpdate> updates = new ArrayList<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "emergency_event_target_teams",
            joinColumns = @JoinColumn(name = "emergency_event_id"),
            inverseJoinColumns = @JoinColumn(name = "team_id")
    )
    @Builder.Default
    private Set<Team> targetTeams = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "emergency_event_target_groups",
            joinColumns = @JoinColumn(name = "emergency_event_id"),
            inverseJoinColumns = @JoinColumn(name = "member_group_id")
    )
    @Builder.Default
    private Set<MemberGroup> targetGroups = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public enum EmergencyEventType {
        FIRE_DRILL, EMERGENCY, EVACUATION, LOCKDOWN
    }

    public enum EmergencyEventStatus {
        ACTIVE, RESOLVED, CANCELLED
    }
}
