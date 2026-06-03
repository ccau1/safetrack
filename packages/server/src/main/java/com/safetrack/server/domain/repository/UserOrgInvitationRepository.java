package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.UserOrgInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserOrgInvitationRepository extends JpaRepository<UserOrgInvitation, UUID> {

    Optional<UserOrgInvitation> findByToken(String token);

    List<UserOrgInvitation> findByOrganizationIdAndStatus(UUID organizationId, UserOrgInvitation.Status status);

    boolean existsByOrganizationIdAndEmailAndStatus(UUID organizationId, String email, UserOrgInvitation.Status status);

    Optional<UserOrgInvitation> findByOrganizationIdAndEmailAndStatus(UUID organizationId, String email, UserOrgInvitation.Status status);
}
