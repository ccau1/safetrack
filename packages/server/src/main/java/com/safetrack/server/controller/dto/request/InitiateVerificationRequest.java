package com.safetrack.server.controller.dto.request;

import com.safetrack.server.domain.entity.VerificationChallenge;
import jakarta.validation.constraints.NotNull;

public record InitiateVerificationRequest(
    @NotNull VerificationChallenge.Method method
) {}
