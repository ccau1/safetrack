package com.safetrack.server.service;

import com.safetrack.server.domain.entity.EmergencyEventUpdate;

import java.util.List;
import java.util.UUID;

public interface EmergencyEventUpdateService {
    EmergencyEventUpdate createUpdate(UUID emergencyEventId, UUID createdByMemberId, String text,
                                      EmergencyEventUpdate.UpdateType type);
    List<EmergencyEventUpdate> findByEmergencyEventId(UUID emergencyEventId);
}
