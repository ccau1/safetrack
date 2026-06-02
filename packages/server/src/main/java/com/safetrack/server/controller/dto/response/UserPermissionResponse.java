package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record UserPermissionResponse(
    UUID id,
    String action,
    String effect,
    Instant createdAt
) {}
