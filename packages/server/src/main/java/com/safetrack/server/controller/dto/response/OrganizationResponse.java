package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record OrganizationResponse(
    UUID id,
    String name,
    String slug,
    Instant createdAt
) {}
