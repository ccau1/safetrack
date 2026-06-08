package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.ConfirmVerificationRequest;
import com.safetrack.server.controller.dto.response.ContactPointResponse;
import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.service.VerificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class VerificationController {

    private final VerificationService verificationService;

    @PostMapping("/api/contact-points/verify/confirm")
    public ResponseEntity<ContactPointResponse> confirmVerification(
            @Valid @RequestBody ConfirmVerificationRequest request) {
        ContactPoint contactPoint;

        if (request.token() != null && !request.token().isBlank()) {
            contactPoint = verificationService.verifyByToken(request.token());
        } else if (request.contactPointId() != null && request.code() != null && !request.code().isBlank()) {
            contactPoint = verificationService.verifyByCode(request.contactPointId(), request.code());
        } else {
            throw new IllegalArgumentException("Either token or contactPointId + code must be provided");
        }

        return ResponseEntity.ok(toResponse(contactPoint));
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
