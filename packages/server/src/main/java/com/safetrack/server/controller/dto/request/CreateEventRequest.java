package com.safetrack.server.controller.dto.request;

import com.safetrack.server.domain.entity.Event;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateEventRequest(
    @NotBlank @Size(max = 255) String title,
    String description,
    Event.EventType type,
    Instant startedAt
) {}
