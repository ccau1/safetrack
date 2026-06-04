package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.MemberGroup;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Team;
import com.safetrack.server.domain.repository.MemberGroupRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.TeamRepository;
import com.safetrack.server.service.MemberGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberGroupServiceImpl implements MemberGroupService {

    private final MemberGroupRepository memberGroupRepository;
    private final OrganizationRepository organizationRepository;
    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;

    @Override
    public List<MemberGroup> findByOrganizationId(UUID orgId) {
        return memberGroupRepository.findByOrganizationId(orgId);
    }

    @Override
    public Optional<MemberGroup> findById(UUID id) {
        return memberGroupRepository.findById(id);
    }

    @Override
    public Optional<MemberGroup> findByIdAndOrganizationId(UUID id, UUID orgId) {
        return memberGroupRepository.findByIdAndOrganizationId(id, orgId);
    }

    @Override
    @Transactional
    public MemberGroup createGroup(UUID orgId, String name, Set<UUID> memberIds, Set<UUID> teamIds) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        Set<Member> members = resolveMembers(orgId, memberIds);
        Set<Team> teams = resolveTeams(orgId, teamIds);

        MemberGroup group = MemberGroup.builder()
                .organization(org)
                .name(name)
                .members(members)
                .teams(teams)
                .build();

        return memberGroupRepository.save(group);
    }

    @Override
    @Transactional
    public MemberGroup updateGroup(UUID id, String name, Set<UUID> memberIds, Set<UUID> teamIds) {
        MemberGroup group = memberGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        group.setName(name);
        group.setMembers(resolveMembers(group.getOrganization().getId(), memberIds));
        group.setTeams(resolveTeams(group.getOrganization().getId(), teamIds));

        return memberGroupRepository.save(group);
    }

    @Override
    @Transactional
    public void deleteGroup(UUID id) {
        MemberGroup group = memberGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        memberGroupRepository.delete(group);
    }

    private Set<Member> resolveMembers(UUID orgId, Set<UUID> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return new HashSet<>();
        }
        List<Member> members = memberRepository.findAllById(memberIds);
        for (Member member : members) {
            if (!member.getOrganization().getId().equals(orgId)) {
                throw new IllegalArgumentException("Member does not belong to this organization");
            }
        }
        return new HashSet<>(members);
    }

    private Set<Team> resolveTeams(UUID orgId, Set<UUID> teamIds) {
        if (teamIds == null || teamIds.isEmpty()) {
            return new HashSet<>();
        }
        List<Team> teams = teamRepository.findAllById(teamIds);
        for (Team team : teams) {
            if (!team.getOrganization().getId().equals(orgId)) {
                throw new IllegalArgumentException("Team does not belong to this organization");
            }
        }
        return new HashSet<>(teams);
    }
}
