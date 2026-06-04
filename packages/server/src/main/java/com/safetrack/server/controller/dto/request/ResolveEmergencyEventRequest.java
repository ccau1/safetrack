package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.Size;

public record ResolveEmergencyEventRequest(
    @Size(max = 2000) String comment
) {}
