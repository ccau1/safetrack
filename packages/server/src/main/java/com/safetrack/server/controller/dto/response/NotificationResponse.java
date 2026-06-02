package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
    UUID id,
    String type,
    String title,
    String message,
    UUID organizationId,
    UUID teamId,
    UUID eventId,
    UUID statusReportId,
    UUID actorMemberId,
    String actorMemberName,
    UUID targetMemberId,
    String targetMemberName,
    Instant createdAt,
    boolean read
) {}
