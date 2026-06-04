package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record ScopedMemberResponse(
    UUID memberId,
    String name,
    UUID teamId,
    String teamName,
    String latestStatus,
    String latestLocation,
    Instant latestReportAt
) {}
