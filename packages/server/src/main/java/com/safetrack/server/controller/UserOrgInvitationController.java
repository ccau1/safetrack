package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.AcceptInvitationRequest;
import com.safetrack.server.controller.dto.request.CreateInvitationRequest;
import com.safetrack.server.controller.dto.response.AuthResponse;
import com.safetrack.server.controller.dto.response.BatchInvitationResponse;
import com.safetrack.server.controller.dto.response.InvitationResponse;
import com.safetrack.server.controller.dto.response.InvitationValidationResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserOrgInvitation;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.UserOrgInvitationRepository;
import com.safetrack.server.mapper.UserMapper;
import com.safetrack.server.security.CookieUtil;
import com.safetrack.server.security.JwtService;
import com.safetrack.server.security.permission.PermissionEvaluator;
import com.safetrack.server.security.permission.RequireAction;
import com.safetrack.server.service.RefreshTokenService;
import com.safetrack.server.service.UserOrgInvitationService;
import com.safetrack.server.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class UserOrgInvitationController {

    private final UserOrgInvitationService invitationService;
    private final UserOrgInvitationRepository invitationRepository;
    private final UserService userService;
    private final MemberRepository memberRepository;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final PermissionEvaluator permissionEvaluator;
    private final RefreshTokenService refreshTokenService;
    private final CookieUtil cookieUtil;

    @Value("${app.jwt.expiration-ms:900000}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @RequireAction("safetrack:member:invite")
    @PostMapping("/api/organizations/{orgId}/invitations")
    public ResponseEntity<InvitationResponse> create(
            @PathVariable UUID orgId,
            @Valid @RequestBody CreateInvitationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        UserOrgInvitation invitation = invitationService.createInvitation(orgId, request, user);
        return ResponseEntity.ok(toResponse(invitation));
    }

    @RequireAction("safetrack:member:invite")
    @PostMapping(value = "/api/organizations/{orgId}/invitations/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<BatchInvitationResponse> createBatch(
            @PathVariable UUID orgId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        BatchInvitationResponse result = invitationService.createBatchInvitations(orgId, file, user);
        return ResponseEntity.ok(result);
    }

    @RequireAction("safetrack:member:read")
    @GetMapping("/api/organizations/{orgId}/invitations")
    public ResponseEntity<List<InvitationResponse>> listPending(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal UserDetails userDetails) {
        getCurrentUser(userDetails);
        List<InvitationResponse> invites = invitationService.findPendingByOrganizationId(orgId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(invites);
    }

    @RequireAction("safetrack:member:invite")
    @PostMapping("/api/invitations/{id}/resend")
    public ResponseEntity<InvitationResponse> resend(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        UserOrgInvitation invitation = invitationService.resendInvitation(id, user);
        return ResponseEntity.ok(toResponse(invitation));
    }

    @RequireAction("safetrack:member:invite")
    @DeleteMapping("/api/invitations/{id}")
    public ResponseEntity<Void> cancel(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        invitationService.cancelInvitation(id, user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/invitations/validate")
    public ResponseEntity<InvitationValidationResponse> validateToken(@RequestParam String token) {
        InvitationValidationResponse response = invitationService.validateToken(token);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/invitations/accept")
    public ResponseEntity<AuthResponse> accept(
            @Valid @RequestBody AcceptInvitationRequest request,
            jakarta.servlet.http.HttpServletResponse response) {

        User resultUser;
        if (request.password() != null && !request.password().isBlank()) {
            // New user registration via invite
            resultUser = invitationService.acceptInvitationForNewUser(
                    request.token(), request.password(), request.firstName(), request.lastName());
        } else {
            // Existing user — invitation token is proof of identity.
            // Look up the user by the invitation's email and accept on their behalf.
            UserOrgInvitation invitation = invitationRepository.findByToken(request.token())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

            if (invitation.getStatus() != UserOrgInvitation.Status.PENDING) {
                throw new IllegalStateException("Invitation is no longer valid");
            }
            if (invitation.isExpired()) {
                invitation.setStatus(UserOrgInvitation.Status.EXPIRED);
                invitationRepository.save(invitation);
                throw new IllegalStateException("Invitation has expired");
            }

            User user = userService.findByEmail(invitation.getEmail())
                    .orElseThrow(() -> new IllegalArgumentException("User not found. Please register to accept this invitation."));
            invitationService.acceptInvitation(request.token(), user);
            resultUser = user;
        }

        // Issue JWT cookies for the result user (overwrites any existing session)
        List<Member> members = memberRepository.findByUserId(resultUser.getId());
        Member member = members.stream().findFirst().orElse(null);
        UUID orgId = member != null ? member.getOrganization().getId() : null;
        var actions = permissionEvaluator.computeAllowedActions(resultUser, orgId).stream().toList();

        String accessToken = jwtService.generateToken(resultUser, orgId, actions);
        String refreshToken = refreshTokenService.createRefreshToken(resultUser.getId());

        cookieUtil.setAccessTokenCookie(response, accessToken, (int) (jwtExpirationMs / 1000));
        cookieUtil.setRefreshTokenCookie(response, refreshToken, (int) (refreshExpirationMs / 1000));

        return ResponseEntity.ok(userMapper.toAuthResponse(resultUser, members, actions));
    }

    private User getCurrentUser(UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private InvitationResponse toResponse(UserOrgInvitation invitation) {
        return new InvitationResponse(
                invitation.getId(),
                invitation.getEmail(),
                invitation.getOrganization().getName(),
                invitation.getTeam() != null ? invitation.getTeam().getName() : null,
                invitation.getOrgRole().name(),
                invitation.getStatus().name(),
                invitation.getExpiresAt(),
                invitation.getCreatedAt()
        );
    }
}
