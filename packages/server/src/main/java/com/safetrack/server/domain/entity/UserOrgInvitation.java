package com.safetrack.server.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_org_invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserOrgInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false, unique = true, length = 255)
    private String token;

    @Column(nullable = false, length = 255)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "org_role", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private OrgRole orgRole = OrgRole.ORG_MEMBER;

    @Column(nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Status status = Status.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by", nullable = false)
    private User invitedBy;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "accepted_by")
    private User acceptedBy;

    @Column(name = "invited_first_name", length = 100)
    private String invitedFirstName;

    @Column(name = "invited_last_name", length = 100)
    private String invitedLastName;

    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @Column(name = "alternate_phone_number", length = 50)
    private String alternatePhoneNumber;

    @Column(name = "next_of_kin_name", length = 100)
    private String nextOfKinName;

    @Column(name = "next_of_kin_relationship", length = 50)
    private String nextOfKinRelationship;

    @Column(name = "next_of_kin_phone", length = 50)
    private String nextOfKinPhone;

    @Column(name = "next_of_kin_email", length = 255)
    private String nextOfKinEmail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public enum Status {
        PENDING, ACCEPTED, EXPIRED, CANCELLED
    }

    public enum OrgRole {
        ORG_ADMIN, ORG_MEMBER, SAFETY_OFFICER
    }
}
