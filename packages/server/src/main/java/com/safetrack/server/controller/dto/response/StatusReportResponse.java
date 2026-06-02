package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record StatusReportResponse(
    UUID id,
    UUID eventId,
    UUID memberId,
    String memberName,
    String status,
    String location,
    String note,
    Instant createdAt
) {}
