package com.safetrack.server.controller.dto.response;

import java.time.Instant;

public record InvitationValidationResponse(
    String token,
    String email,
    String organizationName,
    String teamName,
    String orgRole,
    Instant expiresAt,
    boolean existingUser
) {}
