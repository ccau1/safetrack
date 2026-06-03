package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Team;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.TeamRepository;
import com.safetrack.server.service.TeamService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamServiceImpl implements TeamService {

    private final TeamRepository teamRepository;
    private final OrganizationRepository organizationRepository;

    @Override
    @Transactional
    public Team createTeam(UUID organizationId, String name) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        Team team = Team.builder()
                .organization(org)
                .name(name)
                .build();

        return teamRepository.save(team);
    }

    @Override
    @Transactional
    public void deleteTeam(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        if (team.getDeletedAt() != null) {
            return; // idempotent
        }

        team.setDeletedAt(Instant.now());
        teamRepository.save(team);
    }

    @Override
    @Transactional
    public void restoreTeam(UUID teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));

        if (team.getDeletedAt() == null) {
            return; // idempotent
        }

        team.setDeletedAt(null);
        teamRepository.save(team);
    }

    @Override
    public List<Team> findByOrganizationId(UUID organizationId) {
        return teamRepository.findByOrganizationIdAndDeletedAtIsNull(organizationId);
    }

    @Override
    public Optional<Team> findById(UUID id) {
        return teamRepository.findById(id);
    }

    @Override
    public Optional<Team> findActiveById(UUID id) {
        return teamRepository.findByIdAndDeletedAtIsNull(id);
    }
}
