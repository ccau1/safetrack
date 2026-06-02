package com.safetrack.server.service;

import com.safetrack.server.domain.entity.Event;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventService {
    Event createEvent(UUID organizationId, UUID createdByMemberId, String title,
                      String description, Event.EventType type, Instant startedAt);
    List<Event> findByOrganizationId(UUID organizationId);
    List<Event> findActiveByOrganizationId(UUID organizationId);
    Optional<Event> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<Event> findById(UUID id);
    Event resolveEvent(UUID id, UUID organizationId);
    Event cancelEvent(UUID id, UUID organizationId);
}
