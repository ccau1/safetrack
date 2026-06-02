package com.safetrack.server.service;

import com.safetrack.server.domain.entity.Notification;
import com.safetrack.server.domain.entity.NotificationUserRead;

import java.util.List;
import java.util.Set;
import java.util.UUID;

public interface NotificationService {

    Notification createStatusReportNotification(UUID organizationId, UUID teamId, UUID eventId,
                                                 UUID statusReportId, UUID actorMemberId);

    Notification createReminderNotification(UUID organizationId, UUID teamId, UUID actorMemberId,
                                             UUID targetMemberId);

    List<Notification> getUnreadNotificationsForUser(UUID organizationId, UUID teamId, UUID userId);

    List<Notification> getNotificationsForUser(UUID organizationId, UUID teamId);

    Set<UUID> getReadNotificationIds(UUID organizationId, UUID teamId, UUID userId);

    NotificationUserRead markAsRead(UUID notificationId, UUID userId);
}
