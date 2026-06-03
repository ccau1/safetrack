package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record InvitationResponse(
    UUID id,
    String email,
    String organizationName,
    String teamName,
    String orgRole,
    String status,
    Instant expiresAt,
    Instant createdAt
) {}
