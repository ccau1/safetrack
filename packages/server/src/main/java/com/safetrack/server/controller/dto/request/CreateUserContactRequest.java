package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record CreateUserContactRequest(
    @Email @Size(max = 255) String email,
    @Size(max = 50) String phoneNumber,
    @Size(max = 50) String alternatePhoneNumber,
    @Size(max = 100) String nextOfKinName,
    @Size(max = 50) String nextOfKinRelationship,
    @Size(max = 50) String nextOfKinPhone,
    @Email @Size(max = 255) String nextOfKinEmail
) {}
