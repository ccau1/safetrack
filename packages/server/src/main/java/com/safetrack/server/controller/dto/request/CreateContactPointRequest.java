package com.safetrack.server.controller.dto.request;

import com.safetrack.server.domain.entity.ContactPoint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateContactPointRequest(
    @NotNull ContactPoint.ContactPointType type,
    @NotBlank @Size(max = 255) String value,
    @Size(max = 50) String label,
    ContactPoint.ContactPointCategory category
) {}
