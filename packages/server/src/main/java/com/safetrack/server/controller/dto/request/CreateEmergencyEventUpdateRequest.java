package com.safetrack.server.controller.dto.request;

import com.safetrack.server.domain.entity.EmergencyEventUpdate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateEmergencyEventUpdateRequest(
    @NotBlank @Size(max = 2000) String text,
    @NotNull EmergencyEventUpdate.UpdateType type
) {}
