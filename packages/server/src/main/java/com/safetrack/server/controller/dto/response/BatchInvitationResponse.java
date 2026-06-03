package com.safetrack.server.controller.dto.response;

import java.util.List;

public record BatchInvitationResponse(
    int createdCount,
    int skippedCount,
    List<BatchError> errors
) {
    public record BatchError(int row, String email, String reason) {}
}
