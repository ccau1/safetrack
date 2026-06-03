package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.Member;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemberRepository extends JpaRepository<Member, UUID> {
    Optional<Member> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);
    List<Member> findByOrganizationId(UUID organizationId);
    List<Member> findByUserId(UUID userId);
    Optional<Member> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);
    List<Member> findByTeamId(UUID teamId);
    boolean existsByOrganizationIdAndUserId(UUID organizationId, UUID userId);
}
