package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.EmergencyEvent;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.MemberEmergencyStatusReport;
import com.safetrack.server.domain.repository.EmergencyEventRepository;
import com.safetrack.server.domain.repository.MemberEmergencyStatusReportRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.service.EmergencyEventScopeResolver;
import com.safetrack.server.service.MemberEmergencyStatusReportService;
import com.safetrack.server.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberEmergencyStatusReportServiceImpl implements MemberEmergencyStatusReportService {

    private final MemberEmergencyStatusReportRepository memberEmergencyStatusReportRepository;
    private final EmergencyEventRepository emergencyEventRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;
    private final EmergencyEventScopeResolver scopeResolver;

    @Override
    @Transactional
    public MemberEmergencyStatusReport createReport(UUID emergencyEventId, UUID memberId,
                                                    MemberEmergencyStatusReport.MemberEmergencyStatus status,
                                                    String location, String note) {
        EmergencyEvent event = emergencyEventRepository.findById(emergencyEventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (!member.getOrganization().getId().equals(event.getOrganization().getId())) {
            throw new IllegalArgumentException("Member and event are not in the same organization");
        }

        if (!scopeResolver.isMemberInScope(event, memberId)) {
            throw new IllegalArgumentException("Member is not in scope for this event");
        }

        MemberEmergencyStatusReport report = MemberEmergencyStatusReport.builder()
                .emergencyEvent(event)
                .member(member)
                .status(status)
                .location(location)
                .note(note)
                .build();

        MemberEmergencyStatusReport saved = memberEmergencyStatusReportRepository.save(report);

        UUID teamId = member.getTeam() != null ? member.getTeam().getId() : null;
        notificationService.createStatusReportNotification(
                event.getOrganization().getId(),
                teamId,
                emergencyEventId,
                saved.getId(),
                memberId
        );

        return saved;
    }

    @Override
    public List<MemberEmergencyStatusReport> findByEmergencyEventId(UUID emergencyEventId) {
        EmergencyEvent event = emergencyEventRepository.findById(emergencyEventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        Set<UUID> memberIds = scopeResolver.resolveMemberIds(event);
        if (memberIds.isEmpty()) {
            return List.of();
        }
        return memberEmergencyStatusReportRepository.findByEmergencyEventIdAndMemberIdInOrderByCreatedAtDesc(emergencyEventId, memberIds);
    }

    @Override
    public List<MemberEmergencyStatusReport> findByMemberId(UUID memberId) {
        return memberEmergencyStatusReportRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    }
}
