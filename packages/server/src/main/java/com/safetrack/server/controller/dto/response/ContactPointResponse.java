package com.safetrack.server.controller.dto.response;

import com.safetrack.server.domain.entity.ContactPoint;

import java.time.Instant;
import java.util.UUID;

public record ContactPointResponse(
    UUID id,
    UUID userId,
    ContactPoint.ContactPointType type,
    String value,
    String label,
    ContactPoint.ContactPointCategory category,
    Instant verifiedAt,
    boolean isPrimary,
    Instant createdAt
) {}
