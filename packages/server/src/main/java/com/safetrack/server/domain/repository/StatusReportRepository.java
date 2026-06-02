package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.StatusReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StatusReportRepository extends JpaRepository<StatusReport, UUID> {
    List<StatusReport> findByEventIdOrderByCreatedAtDesc(UUID eventId);
    List<StatusReport> findByMemberIdOrderByCreatedAtDesc(UUID memberId);
}
