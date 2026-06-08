package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.VerificationChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VerificationChallengeRepository extends JpaRepository<VerificationChallenge, UUID> {

    List<VerificationChallenge> findByContactPointIdAndStatus(UUID contactPointId, VerificationChallenge.Status status);

    Optional<VerificationChallenge> findByTokenHash(String tokenHash);

    Optional<VerificationChallenge> findByCodeHash(String codeHash);

    @Query("SELECT COUNT(vc) FROM VerificationChallenge vc WHERE vc.contactPoint.id = :contactPointId AND vc.status = 'PENDING' AND vc.createdAt > :since")
    long countPendingByContactPointIdSince(@Param("contactPointId") UUID contactPointId, @Param("since") Instant since);

    @Modifying
    @Query("UPDATE VerificationChallenge vc SET vc.status = 'CANCELLED' WHERE vc.contactPoint.id = :contactPointId AND vc.status = 'PENDING'")
    void cancelPendingByContactPointId(@Param("contactPointId") UUID contactPointId);

    @Modifying
    @Query("UPDATE VerificationChallenge vc SET vc.status = 'EXPIRED' WHERE vc.status = 'PENDING' AND vc.expiresAt < :now")
    int expireOldChallenges(@Param("now") Instant now);
}
