package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record TeamResponse(
    UUID id,
    UUID organizationId,
    String name,
    Instant createdAt
) {}
