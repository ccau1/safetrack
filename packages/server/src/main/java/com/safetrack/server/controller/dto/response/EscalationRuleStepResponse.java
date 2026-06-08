package com.safetrack.server.controller.dto.response;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.EscalationRuleStep;

import java.time.Instant;
import java.util.UUID;

public record EscalationRuleStepResponse(
    UUID id,
    Integer stepOrder,
    EscalationRuleStep.ActionType actionType,
    ContactPoint.ContactPointType contactPointType,
    UUID contactPointId,
    String contactPointValue,
    Integer waitDurationMinutes,
    String messageTemplate,
    Boolean voiceCall,
    Instant createdAt
) {}
