package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record ConfirmVerificationRequest(
    UUID contactPointId,
    String token,
    @Size(min = 6, max = 6) String code
) {}
