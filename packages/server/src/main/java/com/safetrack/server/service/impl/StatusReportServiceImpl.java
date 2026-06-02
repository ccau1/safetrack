package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Event;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.StatusReport;
import com.safetrack.server.domain.repository.EventRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.StatusReportRepository;
import com.safetrack.server.service.NotificationService;
import com.safetrack.server.service.StatusReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StatusReportServiceImpl implements StatusReportService {

    private final StatusReportRepository statusReportRepository;
    private final EventRepository eventRepository;
    private final MemberRepository memberRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public StatusReport createReport(UUID eventId, UUID memberId, StatusReport.MemberStatus status,
                                     String location, String note) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (!member.getOrganization().getId().equals(event.getOrganization().getId())) {
            throw new IllegalArgumentException("Member and event are not in the same organization");
        }

        StatusReport report = StatusReport.builder()
                .event(event)
                .member(member)
                .status(status)
                .location(location)
                .note(note)
                .build();

        StatusReport saved = statusReportRepository.save(report);

        UUID teamId = member.getTeam() != null ? member.getTeam().getId() : null;
        notificationService.createStatusReportNotification(
                event.getOrganization().getId(),
                teamId,
                eventId,
                saved.getId(),
                memberId
        );

        return saved;
    }

    @Override
    public List<StatusReport> findByEventId(UUID eventId) {
        return statusReportRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }

    @Override
    public List<StatusReport> findByMemberId(UUID memberId) {
        return statusReportRepository.findByMemberIdOrderByCreatedAtDesc(memberId);
    }
}
