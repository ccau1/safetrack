package com.safetrack.server.controller.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record GrantPermissionRequest(
    @NotBlank
    String action,

    @NotBlank
    @Pattern(regexp = "Allow|Deny", message = "Effect must be Allow or Deny")
    String effect
) {}
