package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateEscalationRuleRequest(
    @NotBlank String name,
    @NotNull Boolean isDefault
) {}
