package com.safetrack.server.controller.dto.request;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.EscalationRuleStep;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AddEscalationStepRequest(
    @NotNull Integer stepOrder,
    @NotNull EscalationRuleStep.ActionType actionType,
    ContactPoint.ContactPointType contactPointType,
    UUID contactPointId,
    Integer waitDurationMinutes,
    String messageTemplate,
    Boolean voiceCall
) {}
