package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.EmergencyEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EmergencyEventRepository extends JpaRepository<EmergencyEvent, UUID> {
    List<EmergencyEvent> findByOrganizationIdOrderByStartedAtDesc(UUID organizationId);
    List<EmergencyEvent> findByOrganizationIdAndStatus(UUID organizationId, EmergencyEvent.EmergencyEventStatus status);
    Optional<EmergencyEvent> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
