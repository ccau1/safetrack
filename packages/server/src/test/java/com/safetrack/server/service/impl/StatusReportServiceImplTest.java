package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Event;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.StatusReport;
import com.safetrack.server.domain.entity.Team;
import com.safetrack.server.domain.repository.EventRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.StatusReportRepository;
import com.safetrack.server.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StatusReportServiceImplTest {

    @Mock
    private StatusReportRepository statusReportRepository;
    @Mock
    private EventRepository eventRepository;
    @Mock
    private MemberRepository memberRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private StatusReportServiceImpl statusReportService;

    @Test
    void createReport_shouldCreateReportAndNotify() {
        UUID eventId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID reportId = UUID.randomUUID();

        Organization org = Organization.builder().id(orgId).build();
        Event event = Event.builder().id(eventId).organization(org).build();
        Team team = Team.builder().id(teamId).build();
        Member member = Member.builder().id(memberId).organization(org).team(team).build();
        StatusReport savedReport = StatusReport.builder().id(reportId).event(event).member(member).build();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(statusReportRepository.save(any(StatusReport.class))).thenReturn(savedReport);
        when(notificationService.createStatusReportNotification(any(), any(), any(), any(), any())).thenReturn(null);

        StatusReport result = statusReportService.createReport(eventId, memberId, StatusReport.MemberStatus.SAFE, "Building A", "All clear");

        assertEquals(reportId, result.getId());
        verify(notificationService).createStatusReportNotification(orgId, teamId, eventId, reportId, memberId);
    }

    @Test
    void createReport_shouldCreateReportWithoutTeam() {
        UUID eventId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UUID reportId = UUID.randomUUID();

        Organization org = Organization.builder().id(orgId).build();
        Event event = Event.builder().id(eventId).organization(org).build();
        Member member = Member.builder().id(memberId).organization(org).build();
        StatusReport savedReport = StatusReport.builder().id(reportId).build();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(statusReportRepository.save(any(StatusReport.class))).thenReturn(savedReport);
        when(notificationService.createStatusReportNotification(any(), eq(null), any(), any(), any())).thenReturn(null);

        statusReportService.createReport(eventId, memberId, StatusReport.MemberStatus.NEEDS_HELP, null, null);

        verify(notificationService).createStatusReportNotification(orgId, null, eventId, reportId, memberId);
    }

    @Test
    void createReport_shouldThrow_whenEventNotFound() {
        UUID eventId = UUID.randomUUID();
        when(eventRepository.findById(eventId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                statusReportService.createReport(eventId, UUID.randomUUID(), StatusReport.MemberStatus.SAFE, null, null));
    }

    @Test
    void createReport_shouldThrow_whenMemberNotFound() {
        UUID eventId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        when(eventRepository.findById(eventId)).thenReturn(Optional.of(Event.builder().id(eventId).build()));
        when(memberRepository.findById(memberId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                statusReportService.createReport(eventId, memberId, StatusReport.MemberStatus.SAFE, null, null));
    }

    @Test
    void createReport_shouldThrow_whenMemberAndEventDifferentOrgs() {
        UUID eventId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        Organization org1 = Organization.builder().id(UUID.randomUUID()).build();
        Organization org2 = Organization.builder().id(UUID.randomUUID()).build();
        Event event = Event.builder().id(eventId).organization(org1).build();
        Member member = Member.builder().id(memberId).organization(org2).build();

        when(eventRepository.findById(eventId)).thenReturn(Optional.of(event));
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));

        assertThrows(IllegalArgumentException.class, () ->
                statusReportService.createReport(eventId, memberId, StatusReport.MemberStatus.SAFE, null, null));
    }

    @Test
    void findByEventId_shouldReturnReports() {
        UUID eventId = UUID.randomUUID();
        StatusReport report = StatusReport.builder().id(UUID.randomUUID()).build();
        when(statusReportRepository.findByEventIdOrderByCreatedAtDesc(eventId)).thenReturn(List.of(report));

        List<StatusReport> result = statusReportService.findByEventId(eventId);
        assertEquals(1, result.size());
    }

    @Test
    void findByMemberId_shouldReturnReports() {
        UUID memberId = UUID.randomUUID();
        StatusReport report = StatusReport.builder().id(UUID.randomUUID()).build();
        when(statusReportRepository.findByMemberIdOrderByCreatedAtDesc(memberId)).thenReturn(List.of(report));

        List<StatusReport> result = statusReportService.findByMemberId(memberId);
        assertEquals(1, result.size());
    }
}
