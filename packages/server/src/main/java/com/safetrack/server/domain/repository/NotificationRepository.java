package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("""
            SELECT n FROM Notification n
            WHERE n.organization.id = :orgId
              AND (n.team.id IS NULL OR n.team.id = :teamId)
              AND NOT EXISTS (
                  SELECT 1 FROM NotificationUserRead nur
                  WHERE nur.id.notificationId = n.id AND nur.id.userId = :userId
              )
            ORDER BY n.createdAt DESC
            """)
    List<Notification> findUnreadByOrganizationIdAndTeamIdAndUserId(
            @Param("orgId") UUID orgId,
            @Param("teamId") UUID teamId,
            @Param("userId") UUID userId
    );

    @Query("""
            SELECT n FROM Notification n
            WHERE n.organization.id = :orgId
              AND (n.team.id IS NULL OR n.team.id = :teamId)
            ORDER BY n.createdAt DESC
            """)
    List<Notification> findByOrganizationIdAndTeamId(
            @Param("orgId") UUID orgId,
            @Param("teamId") UUID teamId
    );

    @Query("""
            SELECT n.id FROM Notification n
            JOIN NotificationUserRead nur ON nur.id.notificationId = n.id
            WHERE n.organization.id = :orgId
              AND (n.team.id IS NULL OR n.team.id = :teamId)
              AND nur.id.userId = :userId
            """)
    List<UUID> findReadNotificationIdsByOrganizationIdAndTeamIdAndUserId(
            @Param("orgId") UUID orgId,
            @Param("teamId") UUID teamId,
            @Param("userId") UUID userId
    );
}
