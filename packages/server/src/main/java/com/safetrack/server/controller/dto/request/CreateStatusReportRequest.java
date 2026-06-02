package com.safetrack.server.controller.dto.request;

import com.safetrack.server.domain.entity.StatusReport;
import jakarta.validation.constraints.NotNull;

public record CreateStatusReportRequest(
    @NotNull StatusReport.MemberStatus status,
    String location,
    String note
) {}
