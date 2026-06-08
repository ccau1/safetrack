package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.CreateContactPointRequest;
import com.safetrack.server.controller.dto.request.InitiateVerificationRequest;
import com.safetrack.server.controller.dto.response.ContactPointResponse;
import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.VerificationChallenge;
import com.safetrack.server.service.ContactPointService;
import com.safetrack.server.service.UserService;
import com.safetrack.server.service.VerificationService;
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
public class ContactPointController {

    private final ContactPointService contactPointService;
    private final VerificationService verificationService;
    private final UserService userService;

    @GetMapping("/api/users/me/contact-points")
    public ResponseEntity<List<ContactPointResponse>> getMyContactPoints(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = getUser(userDetails);
        List<ContactPoint> points = contactPointService.findByUserId(user.getId());
        return ResponseEntity.ok(points.stream().map(this::toResponse).toList());
    }

    @PostMapping("/api/users/me/contact-points")
    public ResponseEntity<ContactPointResponse> addContactPoint(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateContactPointRequest request) {
        User user = getUser(userDetails);
        ContactPoint point = contactPointService.addContactPoint(
                user.getId(),
                request.type(),
                request.value(),
                request.label(),
                request.category()
        );
        return ResponseEntity.ok(toResponse(point));
    }

    @DeleteMapping("/api/users/me/contact-points/{id}")
    public ResponseEntity<Void> deleteContactPoint(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id) {
        User user = getUser(userDetails);
        contactPointService.deleteContactPoint(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/users/me/contact-points/{id}/verify")
    public ResponseEntity<Void> initiateVerification(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody InitiateVerificationRequest request) {
        User user = getUser(userDetails);
        contactPointService.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Contact point not found"));
        verificationService.initiateVerification(id, request.method());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/api/users/me/contact-points/{id}/verify/resend")
    public ResponseEntity<Void> resendVerification(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable UUID id,
            @Valid @RequestBody InitiateVerificationRequest request) {
        User user = getUser(userDetails);
        contactPointService.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Contact point not found"));
        verificationService.resendVerification(id, request.method());
        return ResponseEntity.accepted().build();
    }

    private User getUser(UserDetails userDetails) {
        return userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private ContactPointResponse toResponse(ContactPoint point) {
        return new ContactPointResponse(
                point.getId(),
                point.getUser().getId(),
                point.getType(),
                point.getValue(),
                point.getLabel(),
                point.getCategory(),
                point.getVerifiedAt(),
                Boolean.TRUE.equals(point.getIsPrimary()),
                point.getCreatedAt()
        );
    }
}
