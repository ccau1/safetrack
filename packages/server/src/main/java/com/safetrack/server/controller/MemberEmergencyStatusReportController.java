package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.CreateMemberEmergencyStatusReportRequest;
import com.safetrack.server.controller.dto.response.MemberEmergencyStatusReportResponse;
import com.safetrack.server.domain.entity.EmergencyEvent;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.MemberEmergencyStatusReport;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.security.permission.RequireAction;
import com.safetrack.server.service.EmergencyEventService;
import com.safetrack.server.service.MemberEmergencyStatusReportService;
import com.safetrack.server.service.MemberService;
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
public class MemberEmergencyStatusReportController {

    private final MemberEmergencyStatusReportService memberEmergencyStatusReportService;
    private final EmergencyEventService emergencyEventService;
    private final UserService userService;
    private final MemberService memberService;
    private final MemberRepository memberRepository;

    @RequireAction("safetrack:status:read")
    @GetMapping("/api/emergency-events/{emergencyEventId}/member-emergency-status-reports")
    public ResponseEntity<List<MemberEmergencyStatusReportResponse>> listReports(@PathVariable UUID emergencyEventId,
                                                                                  @AuthenticationPrincipal UserDetails userDetails) {
        EmergencyEvent event = emergencyEventService.findById(emergencyEventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        validateMembership(event.getOrganization().getId(), userDetails);
        List<MemberEmergencyStatusReportResponse> reports = memberEmergencyStatusReportService.findByEmergencyEventId(emergencyEventId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(reports);
    }

    @RequireAction("safetrack:status:report")
    @PostMapping("/api/emergency-events/{emergencyEventId}/member-emergency-status-reports")
    public ResponseEntity<MemberEmergencyStatusReportResponse> createReport(@PathVariable UUID emergencyEventId,
                                                                             @Valid @RequestBody CreateMemberEmergencyStatusReportRequest request,
                                                                             @AuthenticationPrincipal UserDetails userDetails) {
        EmergencyEvent event = emergencyEventService.findById(emergencyEventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        Member member = validateMembership(event.getOrganization().getId(), userDetails);

        MemberEmergencyStatusReport report = memberEmergencyStatusReportService.createReport(
                emergencyEventId,
                member.getId(),
                request.status(),
                request.location(),
                request.note()
        );
        return ResponseEntity.ok(toResponse(report));
    }

    @GetMapping("/api/members/{memberId}/member-emergency-status-reports")
    public ResponseEntity<List<MemberEmergencyStatusReportResponse>> listMyReports(@PathVariable UUID memberId,
                                                                                    @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Member member = memberService.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (!member.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Not authorized to view these reports");
        }

        List<MemberEmergencyStatusReportResponse> reports = memberEmergencyStatusReportService.findByMemberId(memberId).stream()
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

    private MemberEmergencyStatusReportResponse toResponse(MemberEmergencyStatusReport report) {
        return new MemberEmergencyStatusReportResponse(
                report.getId(),
                report.getEmergencyEvent().getId(),
                report.getMember().getId(),
                report.getMember().getUser().getFirstName() + " " + report.getMember().getUser().getLastName(),
                report.getStatus().name(),
                report.getLocation(),
                report.getNote(),
                report.getCreatedAt()
        );
    }
}
