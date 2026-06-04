package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EmergencyEventResponse(
    UUID id,
    UUID organizationId,
    String title,
    String description,
    String type,
    String status,
    Instant startedAt,
    Instant resolvedAt,
    Instant createdAt,
    List<TeamResponse> targetTeams,
    List<MemberGroupResponse> targetGroups
) {}
