package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EscalationRuleResponse(
    UUID id,
    UUID userId,
    String name,
    boolean isDefault,
    List<EscalationRuleStepResponse> steps,
    Instant createdAt
) {}
