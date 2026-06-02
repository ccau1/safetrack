package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.GrantPermissionRequest;
import com.safetrack.server.controller.dto.response.MemberPermissionResponse;
import com.safetrack.server.controller.dto.response.PermissionCatalogResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Permission;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserPermission;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.PermissionRepository;
import com.safetrack.server.domain.repository.UserPermissionRepository;
import com.safetrack.server.security.permission.RequireAction;
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
public class AdminPermissionController {

    private final UserService userService;
    private final MemberRepository memberRepository;
    private final OrganizationRepository organizationRepository;
    private final PermissionRepository permissionRepository;
    private final UserPermissionRepository userPermissionRepository;

    @RequireAction("safetrack:userPermission:read")
    @GetMapping("/api/organizations/{orgId}/admin/permissions/members")
    public ResponseEntity<List<MemberPermissionResponse>> listMemberPermissions(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal UserDetails userDetails) {

        validateAdminMembership(orgId, userDetails);

        List<Member> members = memberRepository.findByOrganizationId(orgId);
        List<MemberPermissionResponse> responses = members.stream()
                .map(member -> {
                    User user = member.getUser();
                    List<UserPermission> perms = userPermissionRepository
                            .findAllByUserIdAndOrganizationId(user.getId(), orgId);
                    return new MemberPermissionResponse(
                            member.getId(),
                            user.getId(),
                            user.getFirstName(),
                            user.getLastName(),
                            user.getEmail(),
                            member.getOrgRole().name(),
                            perms.stream()
                                    .map(p -> new MemberPermissionResponse.PermissionEntry(
                                            p.getAction(), p.getEffect().name()
                                    ))
                                    .toList()
                    );
                })
                .toList();

        return ResponseEntity.ok(responses);
    }

    @RequireAction("safetrack:userPermission:grant")
    @PostMapping("/api/organizations/{orgId}/admin/permissions/members/{memberId}")
    public ResponseEntity<MemberPermissionResponse.PermissionEntry> grantPermission(
            @PathVariable UUID orgId,
            @PathVariable UUID memberId,
            @Valid @RequestBody GrantPermissionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {

        validateAdminMembership(orgId, userDetails);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (!member.getOrganization().getId().equals(orgId)) {
            throw new IllegalArgumentException("Member does not belong to this organization");
        }

        User user = member.getUser();
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        UserPermission.Effect effect = UserPermission.Effect.valueOf(request.effect());

        UserPermission permission = userPermissionRepository
                .findByUserIdAndActionAndOrganizationId(user.getId(), request.action(), orgId)
                .map(existing -> {
                    existing.setEffect(effect);
                    return userPermissionRepository.save(existing);
                })
                .orElseGet(() -> {
                    UserPermission newPerm = UserPermission.builder()
                            .user(user)
                            .organization(org)
                            .action(request.action())
                            .effect(effect)
                            .build();
                    return userPermissionRepository.save(newPerm);
                });

        return ResponseEntity.ok(new MemberPermissionResponse.PermissionEntry(
                permission.getAction(), permission.getEffect().name()
        ));
    }

    @RequireAction("safetrack:userPermission:revoke")
    @DeleteMapping("/api/organizations/{orgId}/admin/permissions/members/{memberId}/{action}")
    public ResponseEntity<Void> revokePermission(
            @PathVariable UUID orgId,
            @PathVariable UUID memberId,
            @PathVariable String action,
            @AuthenticationPrincipal UserDetails userDetails) {

        validateAdminMembership(orgId, userDetails);

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (!member.getOrganization().getId().equals(orgId)) {
            throw new IllegalArgumentException("Member does not belong to this organization");
        }

        userPermissionRepository.deleteByUserIdAndActionAndOrganizationId(
                member.getUser().getId(), action, orgId);

        return ResponseEntity.noContent().build();
    }

    @RequireAction("safetrack:userPermission:read")
    @GetMapping("/api/organizations/{orgId}/admin/permissions/catalog")
    public ResponseEntity<List<PermissionCatalogResponse>> listPermissionCatalog(
            @PathVariable UUID orgId,
            @AuthenticationPrincipal UserDetails userDetails) {

        validateAdminMembership(orgId, userDetails);

        List<Permission> permissions = permissionRepository.findAll();
        List<PermissionCatalogResponse> response = permissions.stream()
                .map(p -> new PermissionCatalogResponse(
                        p.getAction(),
                        p.getDescription(),
                        p.getCategory()
                ))
                .toList();
        return ResponseEntity.ok(response);
    }

    private void validateAdminMembership(UUID orgId, UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        memberRepository.findByOrganizationIdAndUserId(orgId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
    }
}
