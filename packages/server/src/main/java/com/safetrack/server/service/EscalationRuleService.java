package com.safetrack.server.service;

import com.safetrack.server.domain.entity.EscalationRule;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EscalationRuleService {

    List<EscalationRule> findByUserId(UUID userId);

    Optional<EscalationRule> findByIdAndUserId(UUID ruleId, UUID userId);

    Optional<EscalationRule> findDefaultByUserId(UUID userId);

    EscalationRule createRule(UUID userId, String name, boolean isDefault);

    EscalationRule updateRule(UUID ruleId, UUID userId, String name, boolean isDefault);

    void deleteRule(UUID ruleId, UUID userId);

    EscalationRule addStep(UUID ruleId, UUID userId, int stepOrder, EscalationRuleStepRequest step);

    EscalationRule removeStep(UUID ruleId, UUID userId, UUID stepId);

    record EscalationRuleStepRequest(
            com.safetrack.server.domain.entity.EscalationRuleStep.ActionType actionType,
            com.safetrack.server.domain.entity.ContactPoint.ContactPointType contactPointType,
            UUID contactPointId,
            Integer waitDurationMinutes,
            String messageTemplate,
            Boolean voiceCall
    ) {}
}
