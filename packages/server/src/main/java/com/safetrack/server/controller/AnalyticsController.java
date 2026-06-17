package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.response.EventAnalyticsResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.security.permission.RequireAction;
import com.safetrack.server.service.AnalyticsService;
import com.safetrack.server.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserService userService;
    private final MemberRepository memberRepository;

    @RequireAction("safetrack:event:read")
    @GetMapping("/api/organizations/{orgId}/analytics/events")
    public ResponseEntity<EventAnalyticsResponse> getEventAnalytics(
            @PathVariable UUID orgId,
            @RequestParam(required = false) List<String> teamIds,
            @RequestParam(required = false) List<String> memberIds,
            @RequestParam(required = false) List<String> eventIds,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        validateMembership(orgId, userDetails);

        List<UUID> teamUuidList = parseUuids(teamIds);
        List<UUID> memberUuidList = parseUuids(memberIds);
        List<UUID> eventUuidList = parseUuids(eventIds);

        EventAnalyticsResponse response = analyticsService.getEventAnalytics(
                orgId, teamUuidList, memberUuidList, eventUuidList, from, to
        );
        return ResponseEntity.ok(response);
    }

    private Member validateMembership(UUID orgId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
    }

    private List<UUID> parseUuids(List<String> values) {
        if (values == null || values.isEmpty()) {
            return Collections.emptyList();
        }
        // Support both repeated params (?teamIds=a&teamIds=b) and comma-separated (?teamIds=a,b)
        return values.stream()
                .flatMap(v -> {
                    if (v.contains(",")) {
                        return List.of(v.split(",")).stream();
                    }
                    return java.util.stream.Stream.of(v);
                })
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(UUID::fromString)
                .collect(Collectors.toList());
    }
}
