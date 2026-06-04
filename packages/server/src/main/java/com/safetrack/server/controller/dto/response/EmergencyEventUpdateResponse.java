package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record EmergencyEventUpdateResponse(
    UUID id,
    UUID emergencyEventId,
    UUID createdById,
    String createdByName,
    String text,
    String type,
    Instant createdAt
) {}
