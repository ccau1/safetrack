package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.MemberGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MemberGroupRepository extends JpaRepository<MemberGroup, UUID> {
    List<MemberGroup> findByOrganizationId(UUID organizationId);
    Optional<MemberGroup> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
