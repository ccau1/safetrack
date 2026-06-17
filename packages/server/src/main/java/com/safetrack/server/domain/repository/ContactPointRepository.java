package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.ContactPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContactPointRepository extends JpaRepository<ContactPoint, UUID> {

    List<ContactPoint> findByUserIdOrderByPriorityAsc(UUID userId);

    List<ContactPoint> findByUserId(UUID userId);

    List<ContactPoint> findByUserIdAndType(UUID userId, ContactPoint.ContactPointType type);

    Optional<ContactPoint> findTopByUserIdOrderByPriorityDesc(UUID userId);

    List<ContactPoint> findByUserIdAndTypeAndVerifiedAtIsNotNull(UUID userId, ContactPoint.ContactPointType type);

    Optional<ContactPoint> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndTypeAndValue(UUID userId, ContactPoint.ContactPointType type, String value);

    long countByUserIdAndTypeAndVerifiedAtIsNotNull(UUID userId, ContactPoint.ContactPointType type);

    List<ContactPoint> findByValueAndType(String value, ContactPoint.ContactPointType type);
}
