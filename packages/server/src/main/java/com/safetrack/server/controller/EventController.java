package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.CreateEventRequest;
import com.safetrack.server.controller.dto.response.EventResponse;
import com.safetrack.server.domain.entity.Event;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.security.permission.RequireAction;
import com.safetrack.server.service.EventService;
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
public class EventController {

    private final EventService eventService;
    private final UserService userService;
    private final MemberRepository memberRepository;

    @RequireAction("safetrack:alert:read")
    @GetMapping("/api/organizations/{orgId}/events")
    public ResponseEntity<List<EventResponse>> listEvents(@PathVariable UUID orgId,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        validateMembership(orgId, userDetails);
        List<EventResponse> events = eventService.findByOrganizationId(orgId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(events);
    }

    @RequireAction("safetrack:alert:send")
    @PostMapping("/api/organizations/{orgId}/events")
    public ResponseEntity<EventResponse> createEvent(@PathVariable UUID orgId,
                                                      @Valid @RequestBody CreateEventRequest request,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        Member member = validateMembership(orgId, userDetails);
        Event event = eventService.createEvent(
                orgId,
                member.getId(),
                request.title(),
                request.description(),
                request.type(),
                request.startedAt()
        );
        return ResponseEntity.ok(toResponse(event));
    }

    @GetMapping("/api/events/{id}")
    public ResponseEntity<EventResponse> getEvent(@PathVariable UUID id,
                                                   @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        UUID orgId = getOrgIdForUser(user, id);
        Event event = eventService.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        return ResponseEntity.ok(toResponse(event));
    }

    @RequireAction("safetrack:alert:send")
    @PatchMapping("/api/events/{id}/resolve")
    public ResponseEntity<EventResponse> resolveEvent(@PathVariable UUID id,
                                                       @AuthenticationPrincipal UserDetails userDetails) {
        UUID orgId = resolveEventOrgId(id, userDetails);
        Event resolved = eventService.resolveEvent(id, orgId);
        return ResponseEntity.ok(toResponse(resolved));
    }

    @RequireAction("safetrack:alert:send")
    @PatchMapping("/api/events/{id}/cancel")
    public ResponseEntity<EventResponse> cancelEvent(@PathVariable UUID id,
                                                      @AuthenticationPrincipal UserDetails userDetails) {
        UUID orgId = resolveEventOrgId(id, userDetails);
        Event cancelled = eventService.cancelEvent(id, orgId);
        return ResponseEntity.ok(toResponse(cancelled));
    }

    private Member validateMembership(UUID orgId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
    }

    private UUID getOrgIdForUser(User user, UUID eventId) {
        // Find any org where the user is a member and the event exists
        return memberRepository.findByUserId(user.getId()).stream()
                .map(Member::getOrganization)
                .map(org -> eventService.findByIdAndOrganizationId(eventId, org.getId()).isPresent() ? org.getId() : null)
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

    private EventResponse toResponse(Event event) {
        return new EventResponse(
                event.getId(),
                event.getOrganization().getId(),
                event.getTitle(),
                event.getDescription(),
                event.getType().name(),
                event.getStatus().name(),
                event.getStartedAt(),
                event.getResolvedAt(),
                event.getCreatedAt()
        );
    }
}
