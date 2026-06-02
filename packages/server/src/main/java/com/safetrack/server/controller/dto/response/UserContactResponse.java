package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record UserContactResponse(
    UUID id,
    UUID userId,
    String email,
    String phoneNumber,
    String alternatePhoneNumber,
    String nextOfKinName,
    String nextOfKinRelationship,
    String nextOfKinPhone,
    String nextOfKinEmail,
    Instant createdAt,
    Instant updatedAt
) {}
