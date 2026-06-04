package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.response.NotificationResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Notification;

import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.service.NotificationService;
import com.safetrack.server.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserService userService;
    private final MemberRepository memberRepository;

    @GetMapping("/api/organizations/{orgId}/notifications")
    public ResponseEntity<List<NotificationResponse>> listNotifications(
            @PathVariable UUID orgId,
            @RequestParam(defaultValue = "false") boolean unreadOnly,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Member member = memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));

        UUID teamId = member.getTeam() != null ? member.getTeam().getId() : null;

        List<Notification> notifications;
        if (unreadOnly) {
            notifications = notificationService.getUnreadNotificationsForUser(orgId, teamId, user.getId());
        } else {
            notifications = notificationService.getNotificationsForUser(orgId, teamId);
        }

        java.util.Set<UUID> readIds = unreadOnly
                ? java.util.Set.of()
                : notificationService.getReadNotificationIds(orgId, teamId, user.getId());

        List<NotificationResponse> responses = notifications.stream()
                .map(n -> toResponse(n, readIds.contains(n.getId())))
                .toList();

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/api/notifications/{notificationId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID notificationId,
                                            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        notificationService.markAsRead(notificationId, user.getId());
        return ResponseEntity.ok().build();
    }

    private NotificationResponse toResponse(Notification n, boolean read) {
        String actorName = n.getActorMember() != null
                ? n.getActorMember().getUser().getFirstName() + " " + n.getActorMember().getUser().getLastName()
                : null;
        String targetName = n.getTargetMember() != null
                ? n.getTargetMember().getUser().getFirstName() + " " + n.getTargetMember().getUser().getLastName()
                : null;

        return new NotificationResponse(
                n.getId(),
                n.getType().name(),
                n.getTitle(),
                n.getMessage(),
                n.getOrganization().getId(),
                n.getTeam() != null ? n.getTeam().getId() : null,
                n.getEmergencyEvent() != null ? n.getEmergencyEvent().getId() : null,
                n.getMemberEmergencyStatusReport() != null ? n.getMemberEmergencyStatusReport().getId() : null,
                n.getActorMember() != null ? n.getActorMember().getId() : null,
                actorName,
                n.getTargetMember() != null ? n.getTargetMember().getId() : null,
                targetName,
                n.getCreatedAt(),
                read
        );
    }
}
