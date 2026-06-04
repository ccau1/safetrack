package com.safetrack.server.service;

import com.safetrack.server.domain.entity.EmergencyEvent;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.MemberGroup;
import com.safetrack.server.domain.entity.Team;
import com.safetrack.server.domain.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class EmergencyEventScopeResolver {

    private final MemberRepository memberRepository;

    public Set<UUID> resolveMemberIds(EmergencyEvent event) {
        Set<Team> targetTeams = event.getTargetTeams();
        Set<MemberGroup> targetGroups = event.getTargetGroups();

        if ((targetTeams == null || targetTeams.isEmpty()) && (targetGroups == null || targetGroups.isEmpty())) {
            // Default: all members in the organization
            return memberRepository.findByOrganizationId(event.getOrganization().getId()).stream()
                    .map(Member::getId)
                    .collect(Collectors.toSet());
        }

        Set<UUID> memberIds = new HashSet<>();

        // Direct target teams
        if (targetTeams != null) {
            for (Team team : targetTeams) {
                for (Member member : team.getMembers()) {
                    memberIds.add(member.getId());
                }
            }
        }

        // Target groups: direct members + members from teams inside the group
        if (targetGroups != null) {
            for (MemberGroup group : targetGroups) {
                for (Member member : group.getMembers()) {
                    memberIds.add(member.getId());
                }
                for (Team team : group.getTeams()) {
                    for (Member member : team.getMembers()) {
                        memberIds.add(member.getId());
                    }
                }
            }
        }

        return memberIds;
    }

    public boolean isMemberInScope(EmergencyEvent event, UUID memberId) {
        return resolveMemberIds(event).contains(memberId);
    }
}
