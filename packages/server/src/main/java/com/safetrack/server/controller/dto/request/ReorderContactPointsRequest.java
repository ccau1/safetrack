package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record ReorderContactPointsRequest(
    @NotEmpty List<UUID> contactPointIds
) {}
