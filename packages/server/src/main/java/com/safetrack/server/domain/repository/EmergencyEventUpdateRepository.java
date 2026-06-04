package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.EmergencyEventUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmergencyEventUpdateRepository extends JpaRepository<EmergencyEventUpdate, UUID> {
    List<EmergencyEventUpdate> findByEmergencyEventIdOrderByCreatedAtDesc(UUID emergencyEventId);
}
