package com.safetrack.server.security;

import java.util.Set;
import java.util.UUID;

/**
 * Custom authentication details carrying JWT-derived context.
 */
public record JwtAuthenticationDetails(
    Set<String> actions,
    UUID organizationId
) {}
