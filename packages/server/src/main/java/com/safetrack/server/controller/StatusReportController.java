package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.CreateStatusReportRequest;
import com.safetrack.server.controller.dto.response.StatusReportResponse;
import com.safetrack.server.domain.entity.Event;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.StatusReport;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.security.permission.RequireAction;
import com.safetrack.server.service.EventService;
import com.safetrack.server.service.MemberService;
import com.safetrack.server.service.StatusReportService;
import com.safetrack.server.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class StatusReportController {

    private final StatusReportService statusReportService;
    private final EventService eventService;
    private final UserService userService;
    private final MemberService memberService;
    private final MemberRepository memberRepository;

    @GetMapping("/api/events/{eventId}/status-reports")
    public ResponseEntity<List<StatusReportResponse>> listReports(@PathVariable UUID eventId,
                                                                   @AuthenticationPrincipal UserDetails userDetails) {
        Event event = eventService.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        validateMembership(event.getOrganization().getId(), userDetails);
        List<StatusReportResponse> reports = statusReportService.findByEventId(eventId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(reports);
    }

    @RequireAction("safetrack:status:report")
    @PostMapping("/api/events/{eventId}/status-reports")
    public ResponseEntity<StatusReportResponse> createReport(@PathVariable UUID eventId,
                                                              @Valid @RequestBody CreateStatusReportRequest request,
                                                              @AuthenticationPrincipal UserDetails userDetails) {
        Event event = eventService.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        Member member = validateMembership(event.getOrganization().getId(), userDetails);

        StatusReport report = statusReportService.createReport(
                eventId,
                member.getId(),
                request.status(),
                request.location(),
                request.note()
        );
        return ResponseEntity.ok(toResponse(report));
    }

    @GetMapping("/api/members/{memberId}/status-reports")
    public ResponseEntity<List<StatusReportResponse>> listMyReports(@PathVariable UUID memberId,
                                                                     @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Member member = memberService.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (!member.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to view these reports");
        }

        List<StatusReportResponse> reports = statusReportService.findByMemberId(memberId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(reports);
    }

    private Member validateMembership(UUID orgId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
    }

    private StatusReportResponse toResponse(StatusReport report) {
        return new StatusReportResponse(
                report.getId(),
                report.getEvent().getId(),
                report.getMember().getId(),
                report.getMember().getUser().getFirstName() + " " + report.getMember().getUser().getLastName(),
                report.getStatus().name(),
                report.getLocation(),
                report.getNote(),
                report.getCreatedAt()
        );
    }
}
