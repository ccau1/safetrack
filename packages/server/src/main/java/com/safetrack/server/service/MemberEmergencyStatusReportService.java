package com.safetrack.server.service;

import com.safetrack.server.domain.entity.MemberEmergencyStatusReport;

import java.util.List;
import java.util.UUID;

public interface MemberEmergencyStatusReportService {
    MemberEmergencyStatusReport createReport(UUID emergencyEventId, UUID memberId,
                                             MemberEmergencyStatusReport.MemberEmergencyStatus status,
                                             String location, String note);
    List<MemberEmergencyStatusReport> findByEmergencyEventId(UUID emergencyEventId);
    List<MemberEmergencyStatusReport> findByMemberId(UUID memberId);
}
