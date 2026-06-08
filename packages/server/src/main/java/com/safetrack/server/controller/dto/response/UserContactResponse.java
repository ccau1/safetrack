package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record UserContactResponse(
    UUID id,
    UUID userId,
    String nextOfKinName,
    String nextOfKinRelationship,
    ContactPointResponse nextOfKinPhone,
    ContactPointResponse nextOfKinEmail,
    Instant createdAt,
    Instant updatedAt
) {}
