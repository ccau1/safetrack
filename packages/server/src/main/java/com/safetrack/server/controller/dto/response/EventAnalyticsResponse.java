package com.safetrack.server.controller.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EventAnalyticsResponse(
    List<EventPoint> events,
    List<TeamPerformance> teamPerformances,
    List<MemberDistressRecovery> distressRecoveries,
    OrganizationSla orgSla
) {

    /** Per-event performance snapshot for trend charts. */
    public record EventPoint(
        UUID eventId,
        String eventTitle,
        String eventType,
        Instant startedAt,
        int totalMembers,
        int respondedCount,
        double responseRate,
        Long avgResponseMinutes,
        Long p50ResponseMinutes,
        Long p90ResponseMinutes,
        Long p99ResponseMinutes
    ) {}

    /** Aggregated team performance across the filtered period. */
    public record TeamPerformance(
        UUID teamId,
        String teamName,
        int eventsParticipated,
        int totalMembersAcrossEvents,
        int respondedCount,
        double responseRate,
        Long avgResponseMinutes,
        Long p50ResponseMinutes,
        Long p90ResponseMinutes,
        Long p99ResponseMinutes,
        double slaComplianceRate,
        double distressRate,
        /** Per-event data points for trend lines. */
        List<TeamEventPoint> eventPoints
    ) {
        public record TeamEventPoint(
            UUID eventId,
            String eventTitle,
            Instant startedAt,
            int totalMembers,
            int respondedCount,
            double responseRate,
            Long avgResponseMinutes,
            Long p90ResponseMinutes
        ) {}
    }

    /** Members who reported distress and later became safe. */
    public record MemberDistressRecovery(
        UUID eventId,
        String eventTitle,
        Instant startedAt,
        UUID memberId,
        String memberName,
        String teamName,
        Long distressToSafeMinutes
    ) {}

    /** Organization-wide SLA metrics. */
    public record OrganizationSla(
        int totalEvents,
        int totalMembersAffected,
        double overallResponseRate,
        Long overallAvgResponseMinutes,
        Long overallP50ResponseMinutes,
        Long overallP90ResponseMinutes,
        Long overallP99ResponseMinutes,
        double overallSlaComplianceRate,
        double overallDistressRate
    ) {}
}
