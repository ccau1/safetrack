package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.*;
import com.safetrack.server.domain.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceImplTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private NotificationUserReadRepository notificationUserReadRepository;
    @Mock
    private OrganizationRepository organizationRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private StatusReportRepository statusReportRepository;
    @Mock
    private MemberRepository memberRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    @Test
    void createStatusReportNotification_shouldCreateNotification() {
        UUID orgId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID reportId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();

        Organization org = Organization.builder().id(orgId).build();
        Event event = Event.builder().id(eventId).title("Fire Drill").build();
        StatusReport report = StatusReport.builder().id(reportId).build();
        User actorUser = User.builder().firstName("John").lastName("Doe").build();
        Member actor = Member.builder().id(actorId).user(actorUser).build();
        Team team = Team.builder().id(teamId).build();
        Notification saved = Notification.builder().id(UUID.randomUUID()).build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(statusReportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(memberRepository.findById(actorId)).thenReturn(Optional.of(actor));
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        Notification result = notificationService.createStatusReportNotification(orgId, teamId, eventId, reportId, actorId);
        assertNotNull(result);
    }

    @Test
    void createStatusReportNotification_shouldWorkWithoutTeam() {
        UUID orgId = UUID.randomUUID();
        UUID eventId = UUID.randomUUID();
        UUID reportId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();

        Organization org = Organization.builder().id(orgId).build();
        Event event = Event.builder().id(eventId).title("Fire Drill").build();
        StatusReport report = StatusReport.builder().id(reportId).build();
        User actorUser = User.builder().firstName("John").lastName("Doe").build();
        Member actor = Member.builder().id(actorId).user(actorUser).build();
        Notification saved = Notification.builder().id(UUID.randomUUID()).build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(statusReportRepository.findById(reportId)).thenReturn(Optional.of(report));
        when(memberRepository.findById(actorId)).thenReturn(Optional.of(actor));
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        Notification result = notificationService.createStatusReportNotification(orgId, null, eventId, reportId, actorId);
        assertNotNull(result);
    }

    @Test
    void createReminderNotification_shouldCreateNotification() {
        UUID orgId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        Organization org = Organization.builder().id(orgId).build();
        User actorUser = User.builder().firstName("John").lastName("Doe").build();
        User targetUser = User.builder().firstName("Jane").lastName("Smith").build();
        Member actor = Member.builder().id(actorId).user(actorUser).build();
        Member target = Member.builder().id(targetId).user(targetUser).build();
        Team team = Team.builder().id(teamId).build();
        Notification saved = Notification.builder().id(UUID.randomUUID()).build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(memberRepository.findById(actorId)).thenReturn(Optional.of(actor));
        when(memberRepository.findById(targetId)).thenReturn(Optional.of(target));
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

        Notification result = notificationService.createReminderNotification(orgId, teamId, actorId, targetId);
        assertNotNull(result);
    }

    @Test
    void getUnreadNotificationsForUser_shouldReturnUnread() {
        UUID orgId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Notification n = Notification.builder().id(UUID.randomUUID()).build();

        when(notificationRepository.findUnreadByOrganizationIdAndTeamIdAndUserId(orgId, teamId, userId)).thenReturn(List.of(n));

        List<Notification> result = notificationService.getUnreadNotificationsForUser(orgId, teamId, userId);
        assertEquals(1, result.size());
    }

    @Test
    void getNotificationsForUser_shouldReturnNotifications() {
        UUID orgId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        Notification n = Notification.builder().id(UUID.randomUUID()).build();

        when(notificationRepository.findByOrganizationIdAndTeamId(orgId, teamId)).thenReturn(List.of(n));

        List<Notification> result = notificationService.getNotificationsForUser(orgId, teamId);
        assertEquals(1, result.size());
    }

    @Test
    void getReadNotificationIds_shouldReturnIds() {
        UUID orgId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID notifId = UUID.randomUUID();

        when(notificationRepository.findReadNotificationIdsByOrganizationIdAndTeamIdAndUserId(orgId, teamId, userId))
                .thenReturn(List.of(notifId));

        Set<UUID> result = notificationService.getReadNotificationIds(orgId, teamId, userId);
        assertTrue(result.contains(notifId));
    }

    @Test
    void markAsRead_shouldCreateReadRecord() {
        UUID notifId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Notification notification = Notification.builder().id(notifId).build();
        User user = User.builder().id(userId).build();
        NotificationUserReadId id = new NotificationUserReadId(notifId, userId);
        NotificationUserRead read = NotificationUserRead.builder().id(id).build();

        when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(notificationUserReadRepository.existsById(id)).thenReturn(false);
        when(notificationUserReadRepository.save(any(NotificationUserRead.class))).thenReturn(read);

        NotificationUserRead result = notificationService.markAsRead(notifId, userId);
        assertNotNull(result);
    }

    @Test
    void markAsRead_shouldReturnExisting_whenAlreadyRead() {
        UUID notifId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Notification notification = Notification.builder().id(notifId).build();
        User user = User.builder().id(userId).build();
        NotificationUserReadId id = new NotificationUserReadId(notifId, userId);
        NotificationUserRead existing = NotificationUserRead.builder().id(id).build();

        when(notificationRepository.findById(notifId)).thenReturn(Optional.of(notification));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(notificationUserReadRepository.existsById(id)).thenReturn(true);
        when(notificationUserReadRepository.findById(id)).thenReturn(Optional.of(existing));

        NotificationUserRead result = notificationService.markAsRead(notifId, userId);
        assertEquals(existing, result);
    }

    @Test
    void markAsRead_shouldThrow_whenNotificationNotFound() {
        UUID notifId = UUID.randomUUID();
        when(notificationRepository.findById(notifId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> notificationService.markAsRead(notifId, UUID.randomUUID()));
    }
}
