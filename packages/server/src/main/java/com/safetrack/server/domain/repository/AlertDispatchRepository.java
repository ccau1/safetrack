package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.AlertDispatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlertDispatchRepository extends JpaRepository<AlertDispatch, UUID> {

    List<AlertDispatch> findByEmergencyEventId(UUID emergencyEventId);

    List<AlertDispatch> findByMemberIdAndEmergencyEventId(UUID memberId, UUID emergencyEventId);

    Optional<AlertDispatch> findByTwilioSid(String twilioSid);

    @Query("SELECT ad FROM AlertDispatch ad WHERE ad.status IN ('SENT', 'DELIVERED') AND ad.dispatchedAt < :cutoff")
    List<AlertDispatch> findPendingResponsesOlderThan(@Param("cutoff") Instant cutoff);

    @Query("SELECT ad FROM AlertDispatch ad WHERE ad.member.id = :memberId AND ad.emergencyEvent.id = :eventId AND ad.status = 'REPLIED' ORDER BY ad.respondedAt DESC")
    List<AlertDispatch> findRepliesByMemberAndEvent(@Param("memberId") UUID memberId, @Param("eventId") UUID eventId);

    @Query("SELECT ad FROM AlertDispatch ad WHERE ad.contactPoint.id IN :contactPointIds AND ad.status IN ('SENT', 'DELIVERED') ORDER BY ad.dispatchedAt DESC")
    List<AlertDispatch> findPendingByContactPointIds(@Param("contactPointIds") List<UUID> contactPointIds);
}
