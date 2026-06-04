package com.safetrack.server.controller.dto.request;

import com.safetrack.server.domain.entity.MemberEmergencyStatusReport;
import jakarta.validation.constraints.NotNull;

public record CreateMemberEmergencyStatusReportRequest(
    @NotNull MemberEmergencyStatusReport.MemberEmergencyStatus status,
    String location,
    String note
) {}
