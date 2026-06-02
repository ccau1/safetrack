package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.UpdateMemberTeamRequest;
import com.safetrack.server.controller.dto.response.MemberResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
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
public class MemberController {

    private final MemberService memberService;
    private final UserService userService;
    private final MemberRepository memberRepository;

    @GetMapping("/api/organizations/{orgId}/members")
    public ResponseEntity<List<MemberResponse>> listMembers(@PathVariable UUID orgId,
                                                             @AuthenticationPrincipal UserDetails userDetails) {
        validateMembership(orgId, userDetails);
        List<MemberResponse> members = memberService.findByOrganizationId(orgId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(members);
    }

    @GetMapping("/api/organizations/{orgId}/members/me")
    public ResponseEntity<MemberResponse> getMyMembership(@PathVariable UUID orgId,
                                                           @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        Member member = memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
        return ResponseEntity.ok(toResponse(member));
    }

    @PatchMapping("/api/members/{id}/team")
    public ResponseEntity<MemberResponse> updateMemberTeam(@PathVariable UUID id,
                                                            @Valid @RequestBody UpdateMemberTeamRequest request,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Member target = memberService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        // Allow updating self or require admin role (simplified: allow self for now)
        Member currentMember = memberRepository.findByOrganizationIdAndUserId(
                target.getOrganization().getId(), user.getId()
        ).orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));

        Member updated = memberService.updateTeam(id, request.teamId());
        return ResponseEntity.ok(toResponse(updated));
    }

    @PostMapping("/api/members/{id}/remind")
    public ResponseEntity<Void> remindMember(@PathVariable UUID id,
                                              @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Member target = memberService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        Member actor = memberRepository.findByOrganizationIdAndUserId(
                target.getOrganization().getId(), user.getId()
        ).orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));

        memberService.sendReminder(actor.getId(), target.getId());
        return ResponseEntity.ok().build();
    }

    private void validateMembership(UUID orgId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
    }

    private MemberResponse toResponse(Member member) {
        return new MemberResponse(
                member.getId(),
                member.getUser().getId(),
                member.getUser().getEmail(),
                member.getUser().getFirstName(),
                member.getUser().getLastName(),
                member.getTeam() != null ? member.getTeam().getId() : null,
                member.getTeam() != null ? member.getTeam().getName() : null,
                member.getOrgRole().name(),
                member.getCreatedAt()
        );
    }
}
