package com.safetrack.server.service;

import com.safetrack.server.config.AlertDefinitions;
import com.safetrack.server.domain.entity.*;
import com.safetrack.server.domain.repository.AlertDispatchRepository;
import com.safetrack.server.domain.repository.ContactPointRepository;
import com.safetrack.server.domain.repository.EscalationRuleRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.service.impl.TwilioProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertDispatchService {

    private final AlertDispatchRepository alertDispatchRepository;
    private final ContactPointRepository contactPointRepository;
    private final EscalationRuleRepository escalationRuleRepository;
    private final MemberRepository memberRepository;
    private final AlertDefinitions alertDefinitions;
    private final TwilioProvider twilioProvider;
    private final EmailService emailService;

    @Transactional
    public void dispatchInitialAlert(EmergencyEvent event, Member member, String alertMessage) {
        EscalationRule rule = escalationRuleRepository.findByUserIdAndIsDefaultTrue(member.getUser().getId())
                .orElse(null);

        List<ContactPoint> verifiedPoints = contactPointRepository.findByUserIdOrderByPriorityAsc(member.getUser().getId())
                .stream()
                .filter(ContactPoint::isVerified)
                .toList();

        List<ContactPoint> urgentPoints = urgentOnly(verifiedPoints);
        boolean hasUrgentChannels = !urgentPoints.isEmpty();

        if (rule == null || rule.getSteps().isEmpty()) {
            // No custom rule — dispatch to urgent verified contact points first.
            // Only fall back to email if no urgent channels exist.
            if (hasUrgentChannels) {
                dispatchToContactPoints(event, member, urgentPoints, alertMessage);
            } else {
                dispatchToAllVerifiedContactPoints(event, member, alertMessage);
            }
            return;
        }

        // Start with step 0 (first step)
        EscalationRuleStep firstStep = rule.getSteps().get(0);

        // Emergency policy: email should never be the first choice.
        // If the first step is email and the member has urgent channels, skip it.
        if (hasUrgentChannels && isEmailStep(firstStep)) {
            EscalationRuleStep nextStep = findFirstNonEmailStep(rule.getSteps());
            if (nextStep != null) {
                log.info("Skipping email-first escalation step for member {} — using next non-email step {}",
                        member.getId(), nextStep.getId());
                executeStep(event, member, nextStep, alertMessage);
            } else {
                log.info("Skipping email-first escalation step for member {} — falling back to urgent contact points",
                        member.getId());
                dispatchToContactPoints(event, member, urgentPoints, alertMessage);
            }
            return;
        }

        executeStep(event, member, firstStep, alertMessage);
    }

    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void processEscalations() {
        Instant cutoff = Instant.now().minus(1, ChronoUnit.HOURS);
        List<AlertDispatch> pendingDispatches = alertDispatchRepository.findPendingResponsesOlderThan(cutoff);

        for (AlertDispatch dispatch : pendingDispatches) {
            try {
                handleNoResponse(dispatch);
            } catch (Exception e) {
                log.error("Failed to process escalation for dispatch {}", dispatch.getId(), e);
            }
        }
    }

    private void handleNoResponse(AlertDispatch dispatch) {
        dispatch.markNoResponse();
        alertDispatchRepository.save(dispatch);

        EscalationRuleStep currentStep = dispatch.getEscalationRuleStep();
        if (currentStep == null) {
            return;
        }

        EscalationRule rule = currentStep.getEscalationRule();
        List<EscalationRuleStep> steps = rule.getSteps();

        int currentIndex = -1;
        for (int i = 0; i < steps.size(); i++) {
            if (steps.get(i).getId().equals(currentStep.getId())) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex < 0 || currentIndex >= steps.size() - 1) {
            log.info("No more escalation steps for dispatch {}", dispatch.getId());
            return;
        }

        EscalationRuleStep nextStep = steps.get(currentIndex + 1);
        executeStep(dispatch.getEmergencyEvent(), dispatch.getMember(), nextStep,
                dispatch.getMessage() != null ? dispatch.getMessage() : "Emergency alert");
    }

    private void executeStep(EmergencyEvent event, Member member, EscalationRuleStep step, String alertMessage) {
        String message = buildMessage(step, alertMessage);

        switch (step.getActionType()) {
            case CONTACT_POINT -> dispatchToContactPoint(event, member, step, message);
            case NOTIFY_SUPERVISOR -> notifySupervisor(event, member, message);
            case NOTIFY_EMERGENCY_CONTACT -> notifyEmergencyContact(event, member, message);
        }
    }

    private String buildMessage(EscalationRuleStep step, String alertMessage) {
        if (step.getMessageTemplate() != null) {
            return step.getMessageTemplate().replace("{{message}}", alertMessage);
        }

        if (step.getContactPointType() == ContactPoint.ContactPointType.WHATSAPP) {
            if (Boolean.TRUE.equals(step.getVoiceCall())) {
                return alertDefinitions.getVoiceScript("default", alertMessage);
            }
            return alertDefinitions.getWhatsAppMessage("default", alertMessage);
        }

        if (step.getContactPointType() == ContactPoint.ContactPointType.PHONE) {
            return alertDefinitions.getVoiceScript("default", alertMessage);
        }

        return alertDefinitions.formatMessage(
                step.getContactPointType() != null ? step.getContactPointType().name() : "SMS",
                alertMessage);
    }

    private void dispatchToContactPoint(EmergencyEvent event, Member member, EscalationRuleStep step, String message) {
        List<ContactPoint> contactPoints;
        if (step.getContactPoint() != null) {
            contactPoints = List.of(step.getContactPoint());
        } else if (step.getContactPointType() != null) {
            contactPoints = contactPointRepository.findByUserIdAndTypeAndVerifiedAtIsNotNull(
                    member.getUser().getId(), step.getContactPointType());
        } else {
            log.warn("No contact point or type specified for step {}", step.getId());
            return;
        }

        for (ContactPoint cp : contactPoints) {
            if (!cp.isVerified()) {
                continue;
            }
            sendAndRecord(event, member, step, cp, cp.getType(), cp.getValue(), message);
        }
    }

    private void dispatchToAllVerifiedContactPoints(EmergencyEvent event, Member member, String alertMessage) {
        List<ContactPoint> contactPoints = contactPointRepository.findByUserIdOrderByPriorityAsc(member.getUser().getId());
        for (ContactPoint cp : contactPoints) {
            if (!cp.isVerified()) {
                continue;
            }
            String message = switch (cp.getType()) {
                case WHATSAPP -> alertDefinitions.getWhatsAppMessage("default", alertMessage);
                case PHONE -> alertDefinitions.getVoiceScript("default", alertMessage);
                default -> alertDefinitions.formatMessage(cp.getType().name(), alertMessage);
            };
            sendAndRecord(event, member, null, cp, cp.getType(), cp.getValue(), message);
        }
    }

    private void dispatchToContactPoints(EmergencyEvent event, Member member, List<ContactPoint> contactPoints, String alertMessage) {
        for (ContactPoint cp : contactPoints) {
            if (!cp.isVerified()) {
                continue;
            }
            String message = switch (cp.getType()) {
                case WHATSAPP -> alertDefinitions.getWhatsAppMessage("default", alertMessage);
                case PHONE -> alertDefinitions.getVoiceScript("default", alertMessage);
                default -> alertDefinitions.formatMessage(cp.getType().name(), alertMessage);
            };
            sendAndRecord(event, member, null, cp, cp.getType(), cp.getValue(), message);
        }
    }

    private List<ContactPoint> urgentOnly(List<ContactPoint> points) {
        return points.stream()
                .filter(cp -> cp.getType() != ContactPoint.ContactPointType.EMAIL)
                .sorted(Comparator.comparingInt(ContactPoint::getPriority))
                .toList();
    }

    private boolean isEmailStep(EscalationRuleStep step) {
        return step.getActionType() == EscalationRuleStep.ActionType.CONTACT_POINT
                && step.getContactPointType() == ContactPoint.ContactPointType.EMAIL;
    }

    private EscalationRuleStep findFirstNonEmailStep(List<EscalationRuleStep> steps) {
        for (EscalationRuleStep step : steps) {
            if (!isEmailStep(step)) {
                return step;
            }
        }
        return null;
    }

    private void notifySupervisor(EmergencyEvent event, Member member, String message) {
        Member supervisor = member.getSupervisor();
        if (supervisor == null) {
            log.info("Member {} has no supervisor, skipping escalation", member.getId());
            return;
        }

        List<ContactPoint> supervisorContacts = contactPointRepository.findByUserIdAndTypeAndVerifiedAtIsNotNull(
                supervisor.getUser().getId(), ContactPoint.ContactPointType.SMS);

        for (ContactPoint cp : supervisorContacts) {
            sendAndRecord(event, supervisor, null, cp, cp.getType(), cp.getValue(),
                    "[ESCALATION] Team member alert: " + message);
        }
    }

    private void notifyEmergencyContact(EmergencyEvent event, Member member, String message) {
        List<ContactPoint> emergencyContacts = contactPointRepository.findByUserId(member.getUser().getId()).stream()
                .filter(cp -> cp.getCategory() == ContactPoint.ContactPointCategory.EMERGENCY_CONTACT)
                .filter(ContactPoint::isVerified)
                .toList();

        for (ContactPoint cp : emergencyContacts) {
            sendAndRecord(event, member, null, cp, cp.getType(), cp.getValue(),
                    "[EMERGENCY CONTACT] Alert regarding " + member.getUser().getFirstName() + " " + member.getUser().getLastName() + ": " + message);
        }
    }

    private void sendAndRecord(EmergencyEvent event, Member member, EscalationRuleStep step,
                               ContactPoint contactPoint, ContactPoint.ContactPointType channel,
                               String destination, String message) {
        String twilioSid = null;

        try {
            switch (channel) {
                case EMAIL -> emailService.sendVerificationEmail(destination, message, false);
                case SMS -> twilioProvider.sendSms(destination, message);
                case WHATSAPP -> {
                    if (step != null && Boolean.TRUE.equals(step.getVoiceCall())) {
                        twilioSid = twilioProvider.initiateWhatsAppVoiceCall(destination, message);
                    } else {
                        twilioProvider.sendWhatsApp(destination, message);
                    }
                }
                case PHONE -> twilioSid = twilioProvider.initiateVoiceCall(destination, message);
            }
        } catch (Exception e) {
            log.error("Failed to dispatch alert to {} via {}", destination, channel, e);
        }

        AlertDispatch dispatch = AlertDispatch.builder()
                .emergencyEvent(event)
                .member(member)
                .escalationRuleStep(step)
                .contactPoint(contactPoint)
                .channel(channel)
                .message(message)
                .twilioSid(twilioSid)
                .build();

        alertDispatchRepository.save(dispatch);
        log.info("Alert dispatched to {} via {} for event {}", destination, channel, event.getId());
    }
}
