package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record MemberEmergencyStatusReportResponse(
    UUID id,
    UUID emergencyEventId,
    UUID memberId,
    String memberName,
    String status,
    String location,
    String note,
    Instant createdAt
) {}
