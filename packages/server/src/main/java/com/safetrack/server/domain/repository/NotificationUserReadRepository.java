package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.NotificationUserRead;
import com.safetrack.server.domain.entity.NotificationUserReadId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NotificationUserReadRepository extends JpaRepository<NotificationUserRead, NotificationUserReadId> {
}
