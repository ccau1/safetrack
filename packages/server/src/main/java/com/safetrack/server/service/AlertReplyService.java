package com.safetrack.server.service;

import com.safetrack.server.config.AlertDefinitions;
import com.safetrack.server.domain.entity.AlertDispatch;
import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.MemberEmergencyStatusReport;
import com.safetrack.server.domain.entity.MemberEmergencyStatusReport.MemberEmergencyStatus;

import java.util.UUID;
import com.safetrack.server.domain.repository.AlertDispatchRepository;
import com.safetrack.server.domain.repository.ContactPointRepository;
import com.safetrack.server.domain.repository.MemberEmergencyStatusReportRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertReplyService {

    private final AlertDispatchRepository alertDispatchRepository;
    private final ContactPointRepository contactPointRepository;
    private final MemberEmergencyStatusReportRepository statusReportRepository;
    private final AlertDefinitions alertDefinitions;

    @Transactional
    public void processReply(String fromPhoneNumber, String rawInput, String twilioSid) {
        String normalizedPhone = normalizePhone(fromPhoneNumber);

        AlertDispatch dispatch = null;

        // Try to find by Twilio SID first
        if (twilioSid != null && !twilioSid.startsWith("dev-")) {
            dispatch = alertDispatchRepository.findByTwilioSid(twilioSid).orElse(null);
        }

        // Fallback: find by phone number through contact points
        if (dispatch == null) {
            dispatch = findLatestPendingDispatchByPhone(normalizedPhone);
        }

        if (dispatch == null) {
            log.warn("No pending alert dispatch found for reply from {} with SID {}", normalizedPhone, twilioSid);
            return;
        }

        MemberEmergencyStatus status = alertDefinitions.resolveReply(rawInput);
        if (status == null) {
            log.warn("Unrecognized reply '{}' from {}", rawInput, normalizedPhone);
            return;
        }

        // Mark dispatch as replied
        dispatch.markReplied(rawInput);
        alertDispatchRepository.save(dispatch);

        // Create or update status report for the member on this event
        Member member = dispatch.getMember();
        List<MemberEmergencyStatusReport> existingReports = statusReportRepository
                .findByEmergencyEventIdAndMemberIdOrderByCreatedAtDesc(
                        dispatch.getEmergencyEvent().getId(), member.getId());

        MemberEmergencyStatusReport report;
        if (existingReports.isEmpty()) {
            report = MemberEmergencyStatusReport.builder()
                    .emergencyEvent(dispatch.getEmergencyEvent())
                    .member(member)
                    .status(status)
                    .note("Auto-reported via " + dispatch.getChannel() + " reply: " + rawInput)
                    .build();
        } else {
            report = existingReports.get(0);
            report.setStatus(status);
            report.setNote("Updated via " + dispatch.getChannel() + " reply: " + rawInput);
        }
        statusReportRepository.save(report);

        log.info("Processed reply from {} for event {}: status={}",
                normalizedPhone, dispatch.getEmergencyEvent().getId(), status);
    }

    private AlertDispatch findLatestPendingDispatchByPhone(String phone) {
        List<ContactPoint> contactPoints = contactPointRepository.findByValueAndType(phone, ContactPoint.ContactPointType.PHONE);
        if (contactPoints.isEmpty()) {
            contactPoints = contactPointRepository.findByValueAndType(phone, ContactPoint.ContactPointType.SMS);
        }
        if (contactPoints.isEmpty()) {
            contactPoints = contactPointRepository.findByValueAndType(phone, ContactPoint.ContactPointType.WHATSAPP);
        }

        List<UUID> contactPointIds = contactPoints.stream()
                .map(ContactPoint::getId)
                .toList();

        if (contactPointIds.isEmpty()) {
            return null;
        }

        List<AlertDispatch> dispatches = alertDispatchRepository.findPendingByContactPointIds(contactPointIds);
        return dispatches.isEmpty() ? null : dispatches.get(0);
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[^+0-9]", "");
    }
}
