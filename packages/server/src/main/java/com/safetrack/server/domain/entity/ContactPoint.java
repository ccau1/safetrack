package com.safetrack.server.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contact_points")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactPoint {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    private ContactPointType type;

    @Column(nullable = false, length = 255)
    private String value;

    @Column(length = 50)
    @Builder.Default
    private String label = "Primary";

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ContactPointCategory category = ContactPointCategory.SELF;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "is_primary", nullable = false)
    @Builder.Default
    private Boolean isPrimary = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public boolean isVerified() {
        return verifiedAt != null;
    }

    public enum ContactPointType {
        EMAIL, PHONE, SMS, WHATSAPP
    }

    public enum ContactPointCategory {
        SELF, EMERGENCY_CONTACT
    }
}
