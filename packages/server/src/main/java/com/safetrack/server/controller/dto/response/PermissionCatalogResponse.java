package com.safetrack.server.controller.dto.response;

public record PermissionCatalogResponse(
    String action,
    String description,
    String category
) {}
