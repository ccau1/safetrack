package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record MemberResponse(
    UUID id,
    UUID userId,
    String email,
    String firstName,
    String lastName,
    UUID teamId,
    String teamName,
    String orgRole,
    Instant createdAt
) {}
