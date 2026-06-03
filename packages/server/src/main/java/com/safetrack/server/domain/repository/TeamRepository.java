package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {
    List<Team> findByOrganizationIdAndDeletedAtIsNull(UUID organizationId);
    Optional<Team> findByIdAndDeletedAtIsNull(UUID id);
    Optional<Team> findByOrganizationIdAndNameAndDeletedAtIsNull(UUID organizationId, String name);
}
