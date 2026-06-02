package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.CreateOrganizationRequest;
import com.safetrack.server.controller.dto.response.OrganizationResponse;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.security.permission.RequireAction;
import com.safetrack.server.service.OrganizationService;
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
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<OrganizationResponse>> listMyOrganizations(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        List<OrganizationResponse> orgs = organizationService.findByUserId(user.getId()).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(orgs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrganizationResponse> getOrganization(@PathVariable UUID id) {
        Organization org = organizationService.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));
        return ResponseEntity.ok(toResponse(org));
    }

    @RequireAction("safetrack:organization:update")
    @PostMapping
    public ResponseEntity<OrganizationResponse> createOrganization(
            @Valid @RequestBody CreateOrganizationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getCurrentUser(userDetails);
        Organization org = organizationService.createOrganization(request.name(), user.getId());
        return ResponseEntity.ok(toResponse(org));
    }

    private User getCurrentUser(UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private OrganizationResponse toResponse(Organization org) {
        return new OrganizationResponse(
                org.getId(),
                org.getName(),
                org.getSlug(),
                org.getCreatedAt()
        );
    }
}
