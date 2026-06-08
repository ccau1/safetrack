package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.AddEscalationStepRequest;
import com.safetrack.server.controller.dto.request.CreateEscalationRuleRequest;
import com.safetrack.server.controller.dto.response.EscalationRuleResponse;
import com.safetrack.server.controller.dto.response.EscalationRuleStepResponse;
import com.safetrack.server.domain.entity.EscalationRule;
import com.safetrack.server.domain.entity.EscalationRuleStep;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.service.EscalationRuleService;
import com.safetrack.server.service.EscalationRuleService.EscalationRuleStepRequest;
import com.safetrack.server.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class EscalationRuleController {

    private final EscalationRuleService escalationRuleService;
    private final UserService userService;

    @GetMapping("/api/users/me/escalation-rules")
    public ResponseEntity<List<EscalationRuleResponse>> getMyRules(@AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        List<EscalationRule> rules = escalationRuleService.findByUserId(user.getId());
        return ResponseEntity.ok(rules.stream().map(this::toResponse).toList());
    }

    @PostMapping("/api/users/me/escalation-rules")
    public ResponseEntity<EscalationRuleResponse> createRule(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateEscalationRuleRequest request) {
        User user = getUser(userDetails);
        EscalationRule rule = escalationRuleService.createRule(user.getId(), request.name(), request.isDefault());
        return ResponseEntity.ok(toResponse(rule));
    }

    @PutMapping("/api/users/me/escalation-rules/{ruleId}")
    public ResponseEntity<EscalationRuleResponse> updateRule(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID ruleId,
            @Valid @RequestBody CreateEscalationRuleRequest request) {
        User user = getUser(userDetails);
        EscalationRule rule = escalationRuleService.updateRule(ruleId, user.getId(), request.name(), request.isDefault());
        return ResponseEntity.ok(toResponse(rule));
    }

    @DeleteMapping("/api/users/me/escalation-rules/{ruleId}")
    public ResponseEntity<Void> deleteRule(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID ruleId) {
        User user = getUser(userDetails);
        escalationRuleService.deleteRule(ruleId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/users/me/escalation-rules/{ruleId}/steps")
    public ResponseEntity<EscalationRuleResponse> addStep(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID ruleId,
            @Valid @RequestBody AddEscalationStepRequest request) {
        User user = getUser(userDetails);
        EscalationRuleStepRequest stepReq = new EscalationRuleService.EscalationRuleStepRequest(
                request.actionType(),
                request.contactPointType(),
                request.contactPointId(),
                request.waitDurationMinutes(),
                request.messageTemplate(),
                request.voiceCall()
        );
        EscalationRule rule = escalationRuleService.addStep(ruleId, user.getId(), request.stepOrder(), stepReq);
        return ResponseEntity.ok(toResponse(rule));
    }

    @DeleteMapping("/api/users/me/escalation-rules/{ruleId}/steps/{stepId}")
    public ResponseEntity<EscalationRuleResponse> removeStep(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID ruleId,
            @PathVariable UUID stepId) {
        User user = getUser(userDetails);
        EscalationRule rule = escalationRuleService.removeStep(ruleId, user.getId(), stepId);
        return ResponseEntity.ok(toResponse(rule));
    }

    private User getUser(UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private EscalationRuleResponse toResponse(EscalationRule rule) {
        return new EscalationRuleResponse(
                rule.getId(),
                rule.getUser().getId(),
                rule.getName(),
                Boolean.TRUE.equals(rule.getIsDefault()),
                rule.getSteps().stream().map(this::toStepResponse).toList(),
                rule.getCreatedAt()
        );
    }

    private EscalationRuleStepResponse toStepResponse(EscalationRuleStep step) {
        return new EscalationRuleStepResponse(
                step.getId(),
                step.getStepOrder(),
                step.getActionType(),
                step.getContactPointType(),
                step.getContactPoint() != null ? step.getContactPoint().getId() : null,
                step.getContactPoint() != null ? step.getContactPoint().getValue() : null,
                step.getWaitDurationMinutes(),
                step.getMessageTemplate(),
                step.getVoiceCall(),
                step.getCreatedAt()
        );
    }
}
