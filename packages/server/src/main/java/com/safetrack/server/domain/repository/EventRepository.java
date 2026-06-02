package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {
    List<Event> findByOrganizationIdOrderByStartedAtDesc(UUID organizationId);
    List<Event> findByOrganizationIdAndStatus(UUID organizationId, Event.EventStatus status);
    Optional<Event> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
