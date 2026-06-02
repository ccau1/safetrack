package com.safetrack.server.controller.dto.response;

import java.util.List;
import java.util.UUID;

public record MemberPermissionResponse(
    UUID memberId,
    UUID userId,
    String firstName,
    String lastName,
    String email,
    String orgRole,
    List<PermissionEntry> permissions
) {
    public record PermissionEntry(
        String action,
        String effect
    ) {}
}
