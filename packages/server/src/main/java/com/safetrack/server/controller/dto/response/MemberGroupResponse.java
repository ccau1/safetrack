package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record MemberGroupResponse(
    UUID id,
    UUID organizationId,
    String name,
    List<MemberResponse> members,
    List<TeamResponse> teams,
    Instant createdAt
) {}
