package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.CreateUserContactRequest;
import com.safetrack.server.controller.dto.response.UserContactResponse;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserContact;
import com.safetrack.server.service.UserContactService;
import com.safetrack.server.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserContactController {

    private final UserContactService userContactService;
    private final UserService userService;

    @GetMapping("/api/users/me/contacts")
    public ResponseEntity<UserContactResponse> getMyContacts(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserContact contact = userContactService.findByUserId(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Contact information not found"));

        return ResponseEntity.ok(toResponse(contact));
    }

    @PutMapping("/api/users/me/contacts")
    public ResponseEntity<UserContactResponse> createOrUpdateMyContacts(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody CreateUserContactRequest request) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserContact contact = userContactService.createOrUpdate(
                user.getId(),
                request.email(),
                request.phoneNumber(),
                request.alternatePhoneNumber(),
                request.nextOfKinName(),
                request.nextOfKinRelationship(),
                request.nextOfKinPhone(),
                request.nextOfKinEmail()
        );

        return ResponseEntity.ok(toResponse(contact));
    }

    private UserContactResponse toResponse(UserContact contact) {
        return new UserContactResponse(
                contact.getId(),
                contact.getUser().getId(),
                contact.getEmail(),
                contact.getPhoneNumber(),
                contact.getAlternatePhoneNumber(),
                contact.getNextOfKinName(),
                contact.getNextOfKinRelationship(),
                contact.getNextOfKinPhone(),
                contact.getNextOfKinEmail(),
                contact.getCreatedAt(),
                contact.getUpdatedAt()
        );
    }
}
