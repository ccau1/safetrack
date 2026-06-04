package com.safetrack.server.service;

import com.safetrack.server.domain.entity.EmergencyEvent;
import com.safetrack.server.domain.entity.Member;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface EmergencyEventService {
    EmergencyEvent createEvent(UUID organizationId, UUID createdByMemberId, String title,
                               String description, EmergencyEvent.EmergencyEventType type, Instant startedAt,
                               Set<UUID> targetTeamIds, Set<UUID> targetGroupIds);
    List<EmergencyEvent> findByOrganizationId(UUID organizationId);
    List<EmergencyEvent> findActiveByOrganizationId(UUID organizationId);
    Optional<EmergencyEvent> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Optional<EmergencyEvent> findById(UUID id);
    EmergencyEvent resolveEvent(UUID id, UUID organizationId, String comment);
    EmergencyEvent cancelEvent(UUID id, UUID organizationId);
    EmergencyEvent updateEvent(UUID id, UUID organizationId, String title, String description);
    List<Member> findMembersInScope(UUID eventId, UUID organizationId);
}
