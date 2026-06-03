package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateInvitationRequest(
    @NotBlank @Email String email,
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName,
    @Size(max = 36) String teamId,
    @Size(max = 20) String orgRole,
    @Size(max = 50) String phoneNumber,
    @Size(max = 50) String alternatePhoneNumber,
    @Size(max = 100) String nextOfKinName,
    @Size(max = 50) String nextOfKinRelationship,
    @Size(max = 50) String nextOfKinPhone,
    @Size(max = 255) String nextOfKinEmail
) {}
