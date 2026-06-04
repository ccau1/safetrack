package com.safetrack.server.service;

import com.safetrack.server.domain.entity.MemberGroup;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface MemberGroupService {
    List<MemberGroup> findByOrganizationId(UUID orgId);
    Optional<MemberGroup> findById(UUID id);
    Optional<MemberGroup> findByIdAndOrganizationId(UUID id, UUID orgId);
    MemberGroup createGroup(UUID orgId, String name, Set<UUID> memberIds, Set<UUID> teamIds);
    MemberGroup updateGroup(UUID id, String name, Set<UUID> memberIds, Set<UUID> teamIds);
    void deleteGroup(UUID id);
}
