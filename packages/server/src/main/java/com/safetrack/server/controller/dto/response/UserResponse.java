package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String email,
    String firstName,
    String lastName,
    boolean active,
    List<String> roles,
    Instant createdAt
) {}
