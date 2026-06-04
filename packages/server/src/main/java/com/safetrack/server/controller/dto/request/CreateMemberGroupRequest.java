package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Set;
import java.util.UUID;

public record CreateMemberGroupRequest(
    @NotBlank @Size(max = 255) String name,
    Set<UUID> memberIds,
    Set<UUID> teamIds
) {}
