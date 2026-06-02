package com.safetrack.server.service;

import com.safetrack.server.domain.entity.Team;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamService {
    Team createTeam(UUID organizationId, String name);
    List<Team> findByOrganizationId(UUID organizationId);
    Optional<Team> findById(UUID id);
}
