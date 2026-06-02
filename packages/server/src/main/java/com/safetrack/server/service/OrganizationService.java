package com.safetrack.server.service;

import com.safetrack.server.domain.entity.Organization;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationService {
    Organization createOrganization(String name, UUID creatorUserId);
    Optional<Organization> findById(UUID id);
    Optional<Organization> findBySlug(String slug);
    List<Organization> findByUserId(UUID userId);
}
