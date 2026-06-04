package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateEmergencyEventRequest(
    @NotBlank @Size(max = 255) String title,
    String description
) {}
