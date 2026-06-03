package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AcceptInvitationRequest(
    @NotBlank String token,
    @Size(min = 8, max = 100) String password,
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName
) {}
