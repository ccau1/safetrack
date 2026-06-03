package com.safetrack.server.service;

import com.safetrack.server.domain.entity.Team;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamService {
    Team createTeam(UUID organizationId, String name);
    void deleteTeam(UUID teamId);
    void restoreTeam(UUID teamId);
    List<Team> findByOrganizationId(UUID organizationId);
    Optional<Team> findById(UUID id);
    Optional<Team> findActiveById(UUID id);
}
