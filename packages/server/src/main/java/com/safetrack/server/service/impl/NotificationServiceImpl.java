package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.*;
import com.safetrack.server.domain.repository.*;
import com.safetrack.server.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationUserReadRepository notificationUserReadRepository;
    private final OrganizationRepository organizationRepository;
    private final TeamRepository teamRepository;
    private final EventRepository eventRepository;
    private final StatusReportRepository statusReportRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Notification createStatusReportNotification(UUID organizationId, UUID teamId, UUID eventId,
                                                        UUID statusReportId, UUID actorMemberId) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        StatusReport report = statusReportRepository.findById(statusReportId)
                .orElseThrow(() -> new IllegalArgumentException("Status report not found"));

        Member actor = memberRepository.findById(actorMemberId)
                .orElseThrow(() -> new IllegalArgumentException("Actor member not found"));

        Team team = null;
        if (teamId != null) {
            team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        }

        String actorName = actor.getUser().getFirstName() + " " + actor.getUser().getLastName();

        Notification notification = Notification.builder()
                .type(Notification.Type.STATUS_REPORT)
                .title("New Status Report")
                .message(actorName + " submitted a status report for " + event.getTitle())
                .organization(org)
                .team(team)
                .event(event)
                .statusReport(report)
                .actorMember(actor)
                .build();

        return notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public Notification createReminderNotification(UUID organizationId, UUID teamId, UUID actorMemberId,
                                                    UUID targetMemberId) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        Member actor = memberRepository.findById(actorMemberId)
                .orElseThrow(() -> new IllegalArgumentException("Actor member not found"));

        Member target = memberRepository.findById(targetMemberId)
                .orElseThrow(() -> new IllegalArgumentException("Target member not found"));

        Team team = null;
        if (teamId != null) {
            team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        }

        String actorName = actor.getUser().getFirstName() + " " + actor.getUser().getLastName();
        String targetName = target.getUser().getFirstName() + " " + target.getUser().getLastName();

        Notification notification = Notification.builder()
                .type(Notification.Type.REMINDER)
                .title("Reminder Sent")
                .message(actorName + " reminded " + targetName + " to update their status")
                .organization(org)
                .team(team)
                .actorMember(actor)
                .targetMember(target)
                .build();

        return notificationRepository.save(notification);
    }

    @Override
    public List<Notification> getUnreadNotificationsForUser(UUID organizationId, UUID teamId, UUID userId) {
        return notificationRepository.findUnreadByOrganizationIdAndTeamIdAndUserId(organizationId, teamId, userId);
    }

    @Override
    public List<Notification> getNotificationsForUser(UUID organizationId, UUID teamId) {
        return notificationRepository.findByOrganizationIdAndTeamId(organizationId, teamId);
    }

    @Override
    public Set<UUID> getReadNotificationIds(UUID organizationId, UUID teamId, UUID userId) {
        return Set.copyOf(notificationRepository.findReadNotificationIdsByOrganizationIdAndTeamIdAndUserId(
                organizationId, teamId, userId));
    }

    @Override
    @Transactional
    public NotificationUserRead markAsRead(UUID notificationId, UUID userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        NotificationUserReadId id = new NotificationUserReadId(notificationId, userId);
        if (notificationUserReadRepository.existsById(id)) {
            return notificationUserReadRepository.findById(id).orElseThrow();
        }

        NotificationUserRead read = NotificationUserRead.builder()
                .id(id)
                .notification(notification)
                .user(user)
                .build();

        return notificationUserReadRepository.save(read);
    }
}
