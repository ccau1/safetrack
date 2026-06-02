package com.safetrack.server.service;

import com.safetrack.server.domain.entity.StatusReport;

import java.util.List;
import java.util.UUID;

public interface StatusReportService {
    StatusReport createReport(UUID eventId, UUID memberId, StatusReport.MemberStatus status,
                              String location, String note);
    List<StatusReport> findByEventId(UUID eventId);
    List<StatusReport> findByMemberId(UUID memberId);
}
