package com.safetrack.server.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_contacts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserContact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "next_of_kin_name", length = 100)
    private String nextOfKinName;

    @Column(name = "next_of_kin_relationship", length = 50)
    private String nextOfKinRelationship;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "next_of_kin_phone_contact_point_id")
    private ContactPoint nextOfKinPhoneContactPoint;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "next_of_kin_email_contact_point_id")
    private ContactPoint nextOfKinEmailContactPoint;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
