package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.CreateTeamRequest;
import com.safetrack.server.controller.dto.response.TeamResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Team;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.security.permission.RequireAction;
import com.safetrack.server.service.TeamService;
import com.safetrack.server.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TeamController {

    private final TeamService teamService;
    private final UserService userService;
    private final MemberRepository memberRepository;

    @GetMapping("/api/organizations/{orgId}/teams")
    public ResponseEntity<List<TeamResponse>> listTeams(@PathVariable UUID orgId,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        validateMembership(orgId, userDetails);
        List<TeamResponse> teams = teamService.findByOrganizationId(orgId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(teams);
    }

    @RequireAction("safetrack:team:create")
    @PostMapping("/api/organizations/{orgId}/teams")
    public ResponseEntity<TeamResponse> createTeam(@PathVariable UUID orgId,
                                                    @Valid @RequestBody CreateTeamRequest request,
                                                    @AuthenticationPrincipal UserDetails userDetails) {
        validateMembership(orgId, userDetails);
        Team team = teamService.createTeam(orgId, request.name());
        return ResponseEntity.ok(toResponse(team));
    }

    @GetMapping("/api/teams/{id}")
    public ResponseEntity<TeamResponse> getTeam(@PathVariable UUID id,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        Team team = teamService.findActiveById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        validateMembership(team.getOrganization().getId(), userDetails);
        return ResponseEntity.ok(toResponse(team));
    }

    @RequireAction("safetrack:team:delete")
    @DeleteMapping("/api/teams/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable UUID id,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        Team team = teamService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        validateMembership(team.getOrganization().getId(), userDetails);
        teamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }

    @RequireAction("safetrack:team:delete")
    @PostMapping("/api/teams/{id}/restore")
    public ResponseEntity<TeamResponse> restoreTeam(@PathVariable UUID id,
                                                     @AuthenticationPrincipal UserDetails userDetails) {
        Team team = teamService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        validateMembership(team.getOrganization().getId(), userDetails);
        teamService.restoreTeam(id);
        return ResponseEntity.ok(toResponse(team));
    }

    private void validateMembership(UUID orgId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
    }

    private TeamResponse toResponse(Team team) {
        return new TeamResponse(
                team.getId(),
                team.getOrganization().getId(),
                team.getName(),
                team.getCreatedAt()
        );
    }
}
