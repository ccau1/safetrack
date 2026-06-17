package com.safetrack.server.service;

import com.safetrack.server.domain.entity.ContactPoint;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContactPointService {

    List<ContactPoint> findByUserId(UUID userId);

    List<ContactPoint> findByUserIdAndType(UUID userId, ContactPoint.ContactPointType type);

    List<ContactPoint> findVerifiedByUserIdAndType(UUID userId, ContactPoint.ContactPointType type);

    Optional<ContactPoint> findByIdAndUserId(UUID contactPointId, UUID userId);

    ContactPoint addContactPoint(UUID userId, ContactPoint.ContactPointType type, String value, String label, ContactPoint.ContactPointCategory category);

    void deleteContactPoint(UUID userId, UUID contactPointId);

    void reorderContactPoints(UUID userId, List<UUID> orderedContactPointIds);

    long countVerifiedByUserIdAndType(UUID userId, ContactPoint.ContactPointType type);
}
