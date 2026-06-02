package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Team;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.TeamRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TeamServiceImplTest {

    @Mock
    private TeamRepository teamRepository;
    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private TeamServiceImpl teamService;

    @Test
    void createTeam_shouldCreateTeam() {
        UUID orgId = UUID.randomUUID();
        Organization org = Organization.builder().id(orgId).name("My Org").build();
        Team savedTeam = Team.builder().id(UUID.randomUUID()).organization(org).name("Engineering").build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(teamRepository.save(any(Team.class))).thenReturn(savedTeam);

        Team result = teamService.createTeam(orgId, "Engineering");
        assertEquals("Engineering", result.getName());
        assertEquals(orgId, result.getOrganization().getId());
    }

    @Test
    void createTeam_shouldThrow_whenOrganizationNotFound() {
        UUID orgId = UUID.randomUUID();
        when(organizationRepository.findById(orgId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> teamService.createTeam(orgId, "Engineering"));
    }

    @Test
    void findByOrganizationId_shouldReturnTeams() {
        UUID orgId = UUID.randomUUID();
        Team team = Team.builder().id(UUID.randomUUID()).name("Engineering").build();
        when(teamRepository.findByOrganizationId(orgId)).thenReturn(List.of(team));

        List<Team> result = teamService.findByOrganizationId(orgId);
        assertEquals(1, result.size());
    }

    @Test
    void findById_shouldReturnTeam() {
        UUID teamId = UUID.randomUUID();
        Team team = Team.builder().id(teamId).name("Engineering").build();
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        Optional<Team> result = teamService.findById(teamId);
        assertTrue(result.isPresent());
    }
}
