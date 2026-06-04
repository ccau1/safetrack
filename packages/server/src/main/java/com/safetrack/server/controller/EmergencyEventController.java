package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.CreateEmergencyEventRequest;
import com.safetrack.server.controller.dto.request.ResolveEmergencyEventRequest;
import com.safetrack.server.controller.dto.request.UpdateEmergencyEventRequest;
import com.safetrack.server.controller.dto.response.*;
import com.safetrack.server.domain.entity.EmergencyEvent;
import com.safetrack.server.domain.entity.EmergencyEventUpdate;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.MemberEmergencyStatusReport;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.security.permission.RequireAction;
import com.safetrack.server.service.EmergencyEventService;
import com.safetrack.server.service.EmergencyEventUpdateService;
import com.safetrack.server.service.MemberEmergencyStatusReportService;
import com.safetrack.server.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class EmergencyEventController {

    private final EmergencyEventService emergencyEventService;
    private final EmergencyEventUpdateService emergencyEventUpdateService;
    private final MemberEmergencyStatusReportService memberEmergencyStatusReportService;
    private final UserService userService;
    private final MemberRepository memberRepository;

    @RequireAction("safetrack:event:read")
    @GetMapping("/api/organizations/{orgId}/emergency-events")
    public ResponseEntity<List<EmergencyEventResponse>> listEvents(@PathVariable UUID orgId,
                                                                    @AuthenticationPrincipal UserDetails userDetails) {
        validateMembership(orgId, userDetails);
        List<EmergencyEventResponse> events = emergencyEventService.findByOrganizationId(orgId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(events);
    }

    @RequireAction("safetrack:event:manage")
    @PostMapping("/api/organizations/{orgId}/emergency-events")
    public ResponseEntity<EmergencyEventResponse> createEvent(@PathVariable UUID orgId,
                                                               @Valid @RequestBody CreateEmergencyEventRequest request,
                                                               @AuthenticationPrincipal UserDetails userDetails) {
        Member member = validateMembership(orgId, userDetails);
        EmergencyEvent event = emergencyEventService.createEvent(
                orgId,
                member.getId(),
                request.title(),
                request.description(),
                request.type(),
                request.startedAt(),
                request.targetTeamIds(),
                request.targetGroupIds()
        );
        return ResponseEntity.ok(toResponse(event));
    }

    @GetMapping("/api/emergency-events/{id}")
    public ResponseEntity<EmergencyEventResponse> getEvent(@PathVariable UUID id,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UUID orgId = getOrgIdForUser(user, id);
        EmergencyEvent event = emergencyEventService.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        return ResponseEntity.ok(toResponse(event));
    }

    @RequireAction("safetrack:event:manage")
    @PatchMapping("/api/emergency-events/{id}")
    public ResponseEntity<EmergencyEventResponse> updateEvent(@PathVariable UUID id,
                                                               @Valid @RequestBody UpdateEmergencyEventRequest request,
                                                               @AuthenticationPrincipal UserDetails userDetails) {
        UUID orgId = resolveEventOrgId(id, userDetails);
        EmergencyEvent updated = emergencyEventService.updateEvent(id, orgId, request.title(), request.description());
        return ResponseEntity.ok(toResponse(updated));
    }

    @RequireAction("safetrack:event:manage")
    @PatchMapping("/api/emergency-events/{id}/resolve")
    public ResponseEntity<EmergencyEventResponse> resolveEvent(@PathVariable UUID id,
                                                                @Valid @RequestBody ResolveEmergencyEventRequest request,
                                                                @AuthenticationPrincipal UserDetails userDetails) {
        UUID orgId = resolveEventOrgId(id, userDetails);
        EmergencyEvent resolved = emergencyEventService.resolveEvent(id, orgId, request.comment());
        return ResponseEntity.ok(toResponse(resolved));
    }

    @RequireAction("safetrack:event:manage")
    @PatchMapping("/api/emergency-events/{id}/cancel")
    public ResponseEntity<EmergencyEventResponse> cancelEvent(@PathVariable UUID id,
                                                               @AuthenticationPrincipal UserDetails userDetails) {
        UUID orgId = resolveEventOrgId(id, userDetails);
        EmergencyEvent cancelled = emergencyEventService.cancelEvent(id, orgId);
        return ResponseEntity.ok(toResponse(cancelled));
    }

    @RequireAction("safetrack:event:read")
    @GetMapping("/api/emergency-events/{id}/updates")
    public ResponseEntity<List<EmergencyEventUpdateResponse>> listUpdates(@PathVariable UUID id,
                                                                           @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UUID orgId = getOrgIdForUser(user, id);
        validateMembership(orgId, userDetails);
        List<EmergencyEventUpdateResponse> updates = emergencyEventUpdateService.findByEmergencyEventId(id).stream()
                .map(this::toUpdateResponse)
                .toList();
        return ResponseEntity.ok(updates);
    }

    @RequireAction("safetrack:event:manage")
    @PostMapping("/api/emergency-events/{id}/updates")
    public ResponseEntity<EmergencyEventUpdateResponse> createUpdate(@PathVariable UUID id,
                                                                      @Valid @RequestBody com.safetrack.server.controller.dto.request.CreateEmergencyEventUpdateRequest request,
                                                                      @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UUID orgId = getOrgIdForUser(user, id);
        Member member = validateMembership(orgId, userDetails);
        EmergencyEventUpdate update = emergencyEventUpdateService.createUpdate(
                id, member.getId(), request.text(), request.type()
        );
        return ResponseEntity.ok(toUpdateResponse(update));
    }

    @RequireAction("safetrack:event:read")
    @GetMapping("/api/emergency-events/{id}/members")
    public ResponseEntity<List<ScopedMemberResponse>> listScopedMembers(@PathVariable UUID id,
                                                                         @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UUID orgId = getOrgIdForUser(user, id);
        validateMembership(orgId, userDetails);

        List<Member> members = emergencyEventService.findMembersInScope(id, orgId);
        List<MemberEmergencyStatusReport> reports = memberEmergencyStatusReportService.findByEmergencyEventId(id);

        List<ScopedMemberResponse> responses = members.stream()
                .map(member -> {
                    MemberEmergencyStatusReport latest = reports.stream()
                            .filter(r -> r.getMember().getId().equals(member.getId()))
                            .max(Comparator.comparing(MemberEmergencyStatusReport::getCreatedAt))
                            .orElse(null);
                    return new ScopedMemberResponse(
                            member.getId(),
                            member.getUser().getFirstName() + " " + member.getUser().getLastName(),
                            member.getTeam() != null ? member.getTeam().getId() : null,
                            member.getTeam() != null ? member.getTeam().getName() : null,
                            latest != null ? latest.getStatus().name() : null,
                            latest != null ? latest.getLocation() : null,
                            latest != null ? latest.getCreatedAt() : null
                    );
                })
                .toList();

        return ResponseEntity.ok(responses);
    }

    private Member validateMembership(UUID orgId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
    }

    private UUID getOrgIdForUser(User user, UUID eventId) {
        return memberRepository.findByUserId(user.getId()).stream()
                .map(Member::getOrganization)
                .map(org -> emergencyEventService.findByIdAndOrganizationId(eventId, org.getId()).isPresent() ? org.getId() : null)
                .filter(id -> id != null)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
    }

    private UUID resolveEventOrgId(UUID eventId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UUID orgId = getOrgIdForUser(user, eventId);
        validateMembership(orgId, userDetails);
        return orgId;
    }

    private EmergencyEventResponse toResponse(EmergencyEvent event) {
        UUID orgId = event.getOrganization().getId();
        List<TeamResponse> targetTeams = event.getTargetTeams().stream()
                .map(team -> new TeamResponse(team.getId(), orgId, team.getName(), team.getCreatedAt()))
                .toList();
        List<MemberGroupResponse> targetGroups = event.getTargetGroups().stream()
                .map(group -> new MemberGroupResponse(group.getId(), orgId, group.getName(), List.of(), List.of(), group.getCreatedAt()))
                .toList();
        return new EmergencyEventResponse(
                event.getId(),
                event.getOrganization().getId(),
                event.getTitle(),
                event.getDescription(),
                event.getType().name(),
                event.getStatus().name(),
                event.getStartedAt(),
                event.getResolvedAt(),
                event.getCreatedAt(),
                targetTeams,
                targetGroups
        );
    }

    private EmergencyEventUpdateResponse toUpdateResponse(EmergencyEventUpdate update) {
        return new EmergencyEventUpdateResponse(
                update.getId(),
                update.getEmergencyEvent().getId(),
                update.getCreatedBy().getId(),
                update.getCreatedBy().getUser().getFirstName() + " " + update.getCreatedBy().getUser().getLastName(),
                update.getText(),
                update.getType().name(),
                update.getCreatedAt()
        );
    }
}
