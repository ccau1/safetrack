package com.safetrack.server.service;

import com.safetrack.server.controller.dto.response.EventAnalyticsResponse;
import com.safetrack.server.controller.dto.response.EventAnalyticsResponse.*;
import com.safetrack.server.domain.entity.EmergencyEvent;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.MemberEmergencyStatusReport;
import com.safetrack.server.domain.repository.EmergencyEventRepository;
import com.safetrack.server.domain.repository.MemberEmergencyStatusReportRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final long SLA_THRESHOLD_MINUTES = 15;

    private final EmergencyEventRepository emergencyEventRepository;
    private final MemberEmergencyStatusReportRepository reportRepository;
    private final MemberRepository memberRepository;
    private final EmergencyEventScopeResolver scopeResolver;

    public EventAnalyticsResponse getEventAnalytics(
            UUID orgId,
            List<UUID> teamIds,
            List<UUID> memberIds,
            List<UUID> eventIds,
            Instant from,
            Instant to
    ) {
        List<EmergencyEvent> events = emergencyEventRepository.findByOrganizationIdOrderByStartedAtDesc(orgId);

        List<EmergencyEvent> filteredEvents = events.stream()
                .filter(e -> eventIds == null || eventIds.isEmpty() || eventIds.contains(e.getId()))
                .filter(e -> from == null || !e.getStartedAt().isBefore(from))
                .filter(e -> to == null || !e.getStartedAt().isAfter(to))
                .sorted(Comparator.comparing(EmergencyEvent::getStartedAt))
                .toList();

        List<EventPoint> eventPoints = new ArrayList<>();
        Map<UUID, TeamPerfAccumulator> teamAcc = new LinkedHashMap<>();
        List<MemberDistressRecovery> distressRecoveries = new ArrayList<>();

        // Org-wide accumulators
        int orgTotalMembers = 0;
        int orgResponded = 0;
        List<Long> orgResponseMinutes = new ArrayList<>();
        int orgDistressCount = 0;

        for (EmergencyEvent event : filteredEvents) {
            Set<UUID> scopedMemberIds = scopeResolver.resolveMemberIds(event);

            List<Member> scopedMembers = memberRepository.findByOrganizationId(orgId).stream()
                    .filter(m -> scopedMemberIds.contains(m.getId()))
                    .toList();

            List<Member> filteredMembers = scopedMembers;
            if (memberIds != null && !memberIds.isEmpty()) {
                filteredMembers = scopedMembers.stream()
                        .filter(m -> memberIds.contains(m.getId()))
                        .toList();
            }
            if (teamIds != null && !teamIds.isEmpty()) {
                filteredMembers = filteredMembers.stream()
                        .filter(m -> m.getTeam() != null && teamIds.contains(m.getTeam().getId()))
                        .toList();
            }

            if (filteredMembers.isEmpty()) continue;

            List<MemberEmergencyStatusReport> reports = reportRepository
                    .findByEmergencyEventIdOrderByCreatedAtDesc(event.getId());

            Map<UUID, Instant> firstReportByMember = new HashMap<>();
            for (MemberEmergencyStatusReport report : reports) {
                UUID mid = report.getMember().getId();
                firstReportByMember.merge(mid, report.getCreatedAt(),
                        (existing, candidate) -> candidate.isBefore(existing) ? candidate : existing);
            }

            // Event-level metrics
            List<Long> eventResponseMinutes = new ArrayList<>();
            int eventResponded = 0;
            int eventDistress = 0;

            for (Member member : filteredMembers) {
                Instant firstReport = firstReportByMember.get(member.getId());
                if (firstReport != null && event.getStartedAt() != null) {
                    eventResponded++;
                    long minutes = Duration.between(event.getStartedAt(), firstReport).toMinutes();
                    eventResponseMinutes.add(minutes >= 0 ? minutes : 0L);
                }

                MemberEmergencyStatusReport latest = reports.stream()
                        .filter(r -> r.getMember().getId().equals(member.getId()))
                        .findFirst()
                        .orElse(null);
                if (latest != null && "NEEDS_HELP".equals(latest.getStatus().name())) {
                    eventDistress++;
                }
            }

            orgTotalMembers += filteredMembers.size();
            orgResponded += eventResponded;
            orgResponseMinutes.addAll(eventResponseMinutes);
            orgDistressCount += eventDistress;

            eventPoints.add(new EventPoint(
                    event.getId(),
                    event.getTitle(),
                    event.getType().name(),
                    event.getStartedAt(),
                    filteredMembers.size(),
                    eventResponded,
                    pct(eventResponded, filteredMembers.size()),
                    avg(eventResponseMinutes),
                    percentile(eventResponseMinutes, 50),
                    percentile(eventResponseMinutes, 90),
                    percentile(eventResponseMinutes, 99)
            ));

            // Per-team metrics
            Map<UUID, List<Member>> membersByTeam = new HashMap<>();
            for (Member member : filteredMembers) {
                UUID tid = member.getTeam() != null ? member.getTeam().getId()
                        : UUID.fromString("00000000-0000-0000-0000-000000000000");
                membersByTeam.computeIfAbsent(tid, k -> new ArrayList<>()).add(member);
            }

            for (Map.Entry<UUID, List<Member>> entry : membersByTeam.entrySet()) {
                UUID teamId = entry.getKey();
                List<Member> teamMembers = entry.getValue();
                String teamName = teamMembers.get(0).getTeam() != null
                        ? teamMembers.get(0).getTeam().getName() : "Unassigned";

                List<Long> teamResponseMinutes = new ArrayList<>();
                int teamResponded = 0;
                int teamDistress = 0;

                for (Member member : teamMembers) {
                    Instant firstReport = firstReportByMember.get(member.getId());
                    if (firstReport != null && event.getStartedAt() != null) {
                        teamResponded++;
                        long minutes = Duration.between(event.getStartedAt(), firstReport).toMinutes();
                        teamResponseMinutes.add(minutes >= 0 ? minutes : 0L);
                    }

                    MemberEmergencyStatusReport latest = reports.stream()
                            .filter(r -> r.getMember().getId().equals(member.getId()))
                            .findFirst()
                            .orElse(null);
                    if (latest != null && "NEEDS_HELP".equals(latest.getStatus().name())) {
                        teamDistress++;
                    }

                    // Distress recovery
                    List<MemberEmergencyStatusReport> memberReports = reports.stream()
                            .filter(r -> r.getMember().getId().equals(member.getId()))
                            .sorted(Comparator.comparing(MemberEmergencyStatusReport::getCreatedAt))
                            .toList();
                    Long recoveryMinutes = computeDistressToSafeMinutes(memberReports);
                    if (recoveryMinutes != null) {
                        distressRecoveries.add(new MemberDistressRecovery(
                                event.getId(), event.getTitle(), event.getStartedAt(),
                                member.getId(),
                                member.getUser().getFirstName() + " " + member.getUser().getLastName(),
                                teamName, recoveryMinutes));
                    }
                }

                long slaMet = teamResponseMinutes.stream().filter(m -> m <= SLA_THRESHOLD_MINUTES).count();
                double slaCompliance = teamResponseMinutes.isEmpty() ? 0.0
                        : Math.round(((double) slaMet / teamResponseMinutes.size()) * 1000.0) / 10.0;

                TeamPerfAccumulator acc = teamAcc.computeIfAbsent(teamId,
                        k -> new TeamPerfAccumulator(teamId, teamName));
                acc.eventsParticipated++;
                acc.totalMembersAcrossEvents += teamMembers.size();
                acc.respondedCount += teamResponded;
                acc.distressCount += teamDistress;
                acc.responseMinutes.addAll(teamResponseMinutes);
                acc.slaCompliantCount += slaMet;
                acc.slaTotalCount += teamResponseMinutes.size();

                acc.eventPoints.add(new TeamPerformance.TeamEventPoint(
                        event.getId(), event.getTitle(), event.getStartedAt(),
                        teamMembers.size(), teamResponded,
                        pct(teamResponded, teamMembers.size()),
                        avg(teamResponseMinutes),
                        percentile(teamResponseMinutes, 90)
                ));
            }
        }

        List<TeamPerformance> teamPerformances = teamAcc.values().stream()
                .map(a -> new TeamPerformance(
                        a.teamId, a.teamName, a.eventsParticipated,
                        a.totalMembersAcrossEvents, a.respondedCount,
                        pct(a.respondedCount, a.totalMembersAcrossEvents),
                        avg(a.responseMinutes),
                        percentile(a.responseMinutes, 50),
                        percentile(a.responseMinutes, 90),
                        percentile(a.responseMinutes, 99),
                        a.slaTotalCount > 0 ? Math.round(((double) a.slaCompliantCount / a.slaTotalCount) * 1000.0) / 10.0 : 0.0,
                        pct(a.distressCount, a.totalMembersAcrossEvents),
                        a.eventPoints
                ))
                .sorted(Comparator.comparing(TeamPerformance::teamName))
                .toList();

        long orgSlaMet = orgResponseMinutes.stream().filter(m -> m <= SLA_THRESHOLD_MINUTES).count();
        OrganizationSla orgSla = new OrganizationSla(
                filteredEvents.size(),
                orgTotalMembers,
                pct(orgResponded, orgTotalMembers),
                avg(orgResponseMinutes),
                percentile(orgResponseMinutes, 50),
                percentile(orgResponseMinutes, 90),
                percentile(orgResponseMinutes, 99),
                orgResponseMinutes.isEmpty() ? 0.0
                        : Math.round(((double) orgSlaMet / orgResponseMinutes.size()) * 1000.0) / 10.0,
                pct(orgDistressCount, orgTotalMembers)
        );

        return new EventAnalyticsResponse(eventPoints, teamPerformances, distressRecoveries, orgSla);
    }

    private static Long computeDistressToSafeMinutes(List<MemberEmergencyStatusReport> chronologicalReports) {
        if (chronologicalReports == null || chronologicalReports.size() < 2) return null;
        Instant distressAt = null;
        for (MemberEmergencyStatusReport report : chronologicalReports) {
            if (distressAt != null && "SAFE".equals(report.getStatus().name())) {
                long minutes = Duration.between(distressAt, report.getCreatedAt()).toMinutes();
                return minutes > 0 ? minutes : 0L;
            }
            if ("NEEDS_HELP".equals(report.getStatus().name())) {
                distressAt = report.getCreatedAt();
            }
        }
        return null;
    }

    private static double pct(int numerator, int denominator) {
        if (denominator <= 0) return 0.0;
        return Math.round(((double) numerator / denominator) * 1000.0) / 10.0;
    }

    private static Long avg(List<Long> values) {
        if (values == null || values.isEmpty()) return null;
        return Math.round(values.stream().mapToLong(Long::longValue).average().orElse(0));
    }

    private static Long percentile(List<Long> values, int p) {
        if (values == null || values.isEmpty()) return null;
        List<Long> sorted = values.stream().sorted().toList();
        int n = sorted.size();
        if (n == 1) return sorted.get(0);
        double idx = (p / 100.0) * (n - 1);
        int lower = (int) Math.floor(idx);
        int upper = (int) Math.ceil(idx);
        if (lower == upper) return sorted.get(lower);
        double weight = idx - lower;
        return Math.round(sorted.get(lower) * (1 - weight) + sorted.get(upper) * weight);
    }

    private static class TeamPerfAccumulator {
        UUID teamId;
        String teamName;
        int eventsParticipated;
        int totalMembersAcrossEvents;
        int respondedCount;
        int distressCount;
        List<Long> responseMinutes = new ArrayList<>();
        long slaCompliantCount;
        long slaTotalCount;
        List<TeamPerformance.TeamEventPoint> eventPoints = new ArrayList<>();

        TeamPerfAccumulator(UUID teamId, String teamName) {
            this.teamId = teamId;
            this.teamName = teamName;
        }
    }
}
