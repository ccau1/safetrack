package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.CreateMemberGroupRequest;
import com.safetrack.server.controller.dto.request.UpdateMemberGroupRequest;
import com.safetrack.server.controller.dto.response.MemberGroupResponse;
import com.safetrack.server.controller.dto.response.MemberResponse;
import com.safetrack.server.controller.dto.response.TeamResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.MemberGroup;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.security.permission.RequireAction;
import com.safetrack.server.service.MemberGroupService;
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
public class MemberGroupController {

    private final MemberGroupService memberGroupService;
    private final UserService userService;
    private final MemberRepository memberRepository;

    @RequireAction("safetrack:team:read")
    @GetMapping("/api/organizations/{orgId}/member-groups")
    public ResponseEntity<List<MemberGroupResponse>> listGroups(@PathVariable UUID orgId,
                                                                 @AuthenticationPrincipal UserDetails userDetails) {
        validateMembership(orgId, userDetails);
        List<MemberGroupResponse> groups = memberGroupService.findByOrganizationId(orgId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(groups);
    }

    @RequireAction("safetrack:team:create")
    @PostMapping("/api/organizations/{orgId}/member-groups")
    public ResponseEntity<MemberGroupResponse> createGroup(@PathVariable UUID orgId,
                                                            @Valid @RequestBody CreateMemberGroupRequest request,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        validateMembership(orgId, userDetails);
        MemberGroup group = memberGroupService.createGroup(orgId, request.name(), request.memberIds(), request.teamIds());
        return ResponseEntity.ok(toResponse(group));
    }

    @RequireAction("safetrack:team:read")
    @GetMapping("/api/member-groups/{id}")
    public ResponseEntity<MemberGroupResponse> getGroup(@PathVariable UUID id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        MemberGroup group = memberGroupService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        validateMembership(group.getOrganization().getId(), userDetails);
        return ResponseEntity.ok(toResponse(group));
    }

    @RequireAction("safetrack:team:update")
    @PutMapping("/api/member-groups/{id}")
    public ResponseEntity<MemberGroupResponse> updateGroup(@PathVariable UUID id,
                                                            @Valid @RequestBody UpdateMemberGroupRequest request,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        MemberGroup group = memberGroupService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        validateMembership(group.getOrganization().getId(), userDetails);
        MemberGroup updated = memberGroupService.updateGroup(id, request.name(), request.memberIds(), request.teamIds());
        return ResponseEntity.ok(toResponse(updated));
    }

    @RequireAction("safetrack:team:delete")
    @DeleteMapping("/api/member-groups/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable UUID id,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        MemberGroup group = memberGroupService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        validateMembership(group.getOrganization().getId(), userDetails);
        memberGroupService.deleteGroup(id);
        return ResponseEntity.noContent().build();
    }

    private void validateMembership(UUID orgId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
    }

    private MemberGroupResponse toResponse(MemberGroup group) {
        List<MemberResponse> members = group.getMembers().stream()
                .map(this::toMemberResponse)
                .toList();
        List<TeamResponse> teams = group.getTeams().stream()
                .map(team -> new TeamResponse(team.getId(), group.getOrganization().getId(), team.getName(), team.getCreatedAt()))
                .toList();
        return new MemberGroupResponse(
                group.getId(),
                group.getOrganization().getId(),
                group.getName(),
                members,
                teams,
                group.getCreatedAt()
        );
    }

    private MemberResponse toMemberResponse(Member member) {
        return new MemberResponse(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getEmail(),
                member.getUser().getFirstName(),
                member.getUser().getLastName(),
                member.getTeam() != null ? member.getTeam().getId() : null,
                member.getTeam() != null ? member.getTeam().getName() : null,
                member.getOrgRole().name(),
                member.getSupervisor() != null ? member.getSupervisor().getId() : null,
                member.getSupervisor() != null
                        ? member.getSupervisor().getUser().getFirstName() + " " + member.getSupervisor().getUser().getLastName()
                        : null,
                member.getCreatedAt()
        );
    }
}
