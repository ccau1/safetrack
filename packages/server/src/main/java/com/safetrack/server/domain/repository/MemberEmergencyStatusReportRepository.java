package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.MemberEmergencyStatusReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface MemberEmergencyStatusReportRepository extends JpaRepository<MemberEmergencyStatusReport, UUID> {
    List<MemberEmergencyStatusReport> findByEmergencyEventIdOrderByCreatedAtDesc(UUID emergencyEventId);
    List<MemberEmergencyStatusReport> findByEmergencyEventIdAndMemberIdInOrderByCreatedAtDesc(UUID emergencyEventId, Collection<UUID> memberIds);
    List<MemberEmergencyStatusReport> findByMemberIdOrderByCreatedAtDesc(UUID memberId);
}
