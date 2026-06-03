package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Team;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.TeamRepository;
import com.safetrack.server.service.MemberService;
import com.safetrack.server.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final NotificationService notificationService;

    @Override
    public List<Member> findByOrganizationId(UUID organizationId) {
        return memberRepository.findByOrganizationId(organizationId);
    }

    @Override
    public List<Member> findByUserId(UUID userId) {
        return memberRepository.findByUserId(userId);
    }

    @Override
    public Optional<Member> findByOrganizationIdAndUserId(UUID organizationId, UUID userId) {
        return memberRepository.findByOrganizationIdAndUserId(organizationId, userId);
    }

    @Override
    public Optional<Member> findById(UUID id) {
        return memberRepository.findById(id);
    }

    @Override
    @Transactional
    public Member updateTeam(UUID memberId, UUID teamId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (teamId != null) {
            Team team = teamRepository.findById(teamId)
                    .orElseThrow(() -> new IllegalArgumentException("Team not found"));
            if (team.getDeletedAt() != null) {
                throw new IllegalArgumentException("Team has been deleted");
            }
            if (!team.getOrganization().getId().equals(member.getOrganization().getId())) {
                throw new IllegalArgumentException("Team does not belong to the same organization");
            }
            member.setTeam(team);
        } else {
            member.setTeam(null);
        }

        return memberRepository.save(member);
    }

    @Override
    @Transactional
    public void sendReminder(UUID actorMemberId, UUID targetMemberId) {
        Member actor = memberRepository.findById(actorMemberId)
                .orElseThrow(() -> new IllegalArgumentException("Actor member not found"));

        Member target = memberRepository.findById(targetMemberId)
                .orElseThrow(() -> new IllegalArgumentException("Target member not found"));

        if (!actor.getOrganization().getId().equals(target.getOrganization().getId())) {
            throw new IllegalArgumentException("Actor and target must be in the same organization");
        }

        UUID teamId = target.getTeam() != null ? target.getTeam().getId() : null;

        notificationService.createReminderNotification(
                actor.getOrganization().getId(),
                teamId,
                actorMemberId,
                targetMemberId
        );
    }
}
