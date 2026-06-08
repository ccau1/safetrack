package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.EscalationRule;
import com.safetrack.server.domain.entity.EscalationRuleStep;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.ContactPointRepository;
import com.safetrack.server.domain.repository.EscalationRuleRepository;
import com.safetrack.server.domain.repository.EscalationRuleStepRepository;
import com.safetrack.server.domain.repository.UserRepository;
import com.safetrack.server.service.EscalationRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EscalationRuleServiceImpl implements EscalationRuleService {

    private final EscalationRuleRepository escalationRuleRepository;
    private final EscalationRuleStepRepository stepRepository;
    private final ContactPointRepository contactPointRepository;
    private final UserRepository userRepository;

    @Override
    public List<EscalationRule> findByUserId(UUID userId) {
        return escalationRuleRepository.findByUserId(userId);
    }

    @Override
    public Optional<EscalationRule> findByIdAndUserId(UUID ruleId, UUID userId) {
        return escalationRuleRepository.findByIdAndUserId(ruleId, userId);
    }

    @Override
    public Optional<EscalationRule> findDefaultByUserId(UUID userId) {
        return escalationRuleRepository.findByUserIdAndIsDefaultTrue(userId);
    }

    @Override
    @Transactional
    public EscalationRule createRule(UUID userId, String name, boolean isDefault) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (isDefault) {
            unsetExistingDefault(userId);
        }

        EscalationRule rule = EscalationRule.builder()
                .user(user)
                .name(name != null ? name : "Default")
                .isDefault(isDefault)
                .build();

        return escalationRuleRepository.save(rule);
    }

    @Override
    @Transactional
    public EscalationRule updateRule(UUID ruleId, UUID userId, String name, boolean isDefault) {
        EscalationRule rule = escalationRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found"));

        if (name != null && !name.isBlank()) {
            rule.setName(name);
        }
        if (isDefault) {
            unsetExistingDefault(userId);
        }
        rule.setIsDefault(isDefault);

        return escalationRuleRepository.save(rule);
    }

    @Override
    @Transactional
    public void deleteRule(UUID ruleId, UUID userId) {
        EscalationRule rule = escalationRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found"));
        escalationRuleRepository.delete(rule);
    }

    @Override
    @Transactional
    public EscalationRule addStep(UUID ruleId, UUID userId, int stepOrder, EscalationRuleStepRequest stepReq) {
        EscalationRule rule = escalationRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found"));

        EscalationRuleStep step = EscalationRuleStep.builder()
                .escalationRule(rule)
                .stepOrder(stepOrder)
                .actionType(stepReq.actionType())
                .contactPointType(stepReq.contactPointType())
                .waitDurationMinutes(stepReq.waitDurationMinutes() != null ? stepReq.waitDurationMinutes() : 5)
                .messageTemplate(stepReq.messageTemplate())
                .voiceCall(stepReq.voiceCall() != null ? stepReq.voiceCall() : false)
                .build();

        if (stepReq.contactPointId() != null) {
            contactPointRepository.findById(stepReq.contactPointId())
                    .ifPresent(step::setContactPoint);
        }

        stepRepository.save(step);
        rule.addStep(step);
        return escalationRuleRepository.save(rule);
    }

    @Override
    @Transactional
    public EscalationRule removeStep(UUID ruleId, UUID userId, UUID stepId) {
        EscalationRule rule = escalationRuleRepository.findByIdAndUserId(ruleId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Rule not found"));

        EscalationRuleStep step = stepRepository.findById(stepId)
                .orElseThrow(() -> new IllegalArgumentException("Step not found"));

        if (!step.getEscalationRule().getId().equals(ruleId)) {
            throw new IllegalArgumentException("Step does not belong to this rule");
        }

        rule.removeStep(step);
        stepRepository.delete(step);
        return escalationRuleRepository.save(rule);
    }

    private void unsetExistingDefault(UUID userId) {
        escalationRuleRepository.findByUserIdAndIsDefaultTrue(userId)
                .ifPresent(r -> {
                    r.setIsDefault(false);
                    escalationRuleRepository.save(r);
                });
    }
}
