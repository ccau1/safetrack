package com.safetrack.server.controller.dto.request;

import com.safetrack.server.domain.entity.EmergencyEvent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record CreateEmergencyEventRequest(
    @NotBlank @Size(max = 255) String title,
    String description,
    EmergencyEvent.EmergencyEventType type,
    @NotNull Instant startedAt,
    Set<UUID> targetTeamIds,
    Set<UUID> targetGroupIds
) {}
