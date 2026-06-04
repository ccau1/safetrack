package com.safetrack.server.controller.dto.response;

import java.util.List;
import java.util.UUID;

public record AuthResponse(
    UUID userId,
    String email,
    String firstName,
    String lastName,
    List<String> roles,
    List<String> actions,
    OrganizationInfo organization,
    List<OrganizationInfo> organizations
) {
    public record OrganizationInfo(
        UUID id,
        String name,
        String slug,
        String orgRole,
        boolean isOwner,
        UUID ownerId
    ) {}
}
