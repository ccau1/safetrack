package com.safetrack.server.service;

import com.safetrack.server.domain.entity.Member;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberService {
    List<Member> findByOrganizationId(UUID organizationId);
    List<Member> findByUserId(UUID userId);
    Optional<Member> findByOrganizationIdAndUserId(UUID organizationId, UUID userId);
    Optional<Member> findById(UUID id);
    Member updateTeam(UUID memberId, UUID teamId);
    void sendReminder(UUID actorMemberId, UUID targetMemberId);
}
