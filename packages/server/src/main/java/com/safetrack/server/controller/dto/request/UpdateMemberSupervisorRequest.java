package com.safetrack.server.controller.dto.request;

import java.util.UUID;

public record UpdateMemberSupervisorRequest(
    UUID supervisorMemberId
) {}
