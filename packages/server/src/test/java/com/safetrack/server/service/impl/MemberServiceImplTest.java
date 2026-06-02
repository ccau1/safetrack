package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Team;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.TeamRepository;
import com.safetrack.server.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceImplTest {

    @Mock
    private MemberRepository memberRepository;
    @Mock
    private TeamRepository teamRepository;
    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private MemberServiceImpl memberService;

    @Test
    void findByOrganizationId_shouldReturnMembers() {
        UUID orgId = UUID.randomUUID();
        Member member = Member.builder().id(UUID.randomUUID()).build();
        when(memberRepository.findByOrganizationId(orgId)).thenReturn(List.of(member));

        List<Member> result = memberService.findByOrganizationId(orgId);
        assertEquals(1, result.size());
    }

    @Test
    void findByUserId_shouldReturnMembers() {
        UUID userId = UUID.randomUUID();
        Member member = Member.builder().id(UUID.randomUUID()).build();
        when(memberRepository.findByUserId(userId)).thenReturn(List.of(member));

        List<Member> result = memberService.findByUserId(userId);
        assertEquals(1, result.size());
    }

    @Test
    void updateTeam_shouldSetTeam_whenTeamIdProvided() {
        UUID memberId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();

        Organization org = Organization.builder().id(orgId).build();
        Member member = Member.builder().id(memberId).organization(org).build();
        Team team = Team.builder().id(teamId).organization(org).build();

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));
        when(memberRepository.save(any(Member.class))).thenAnswer(i -> i.getArgument(0));

        Member result = memberService.updateTeam(memberId, teamId);
        assertEquals(teamId, result.getTeam().getId());
    }

    @Test
    void updateTeam_shouldClearTeam_whenTeamIdNull() {
        UUID memberId = UUID.randomUUID();
        Organization org = Organization.builder().id(UUID.randomUUID()).build();
        Member member = Member.builder().id(memberId).organization(org).team(Team.builder().build()).build();

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(memberRepository.save(any(Member.class))).thenAnswer(i -> i.getArgument(0));

        Member result = memberService.updateTeam(memberId, null);
        assertNull(result.getTeam());
    }

    @Test
    void updateTeam_shouldThrow_whenMemberNotFound() {
        UUID memberId = UUID.randomUUID();
        when(memberRepository.findById(memberId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> memberService.updateTeam(memberId, UUID.randomUUID()));
    }

    @Test
    void updateTeam_shouldThrow_whenTeamInDifferentOrganization() {
        UUID memberId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Organization org1 = Organization.builder().id(UUID.randomUUID()).build();
        Organization org2 = Organization.builder().id(UUID.randomUUID()).build();
        Member member = Member.builder().id(memberId).organization(org1).build();
        Team team = Team.builder().id(teamId).organization(org2).build();

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

        assertThrows(IllegalArgumentException.class, () -> memberService.updateTeam(memberId, teamId));
    }

    @Test
    void sendReminder_shouldCreateNotification() {
        UUID actorId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        UUID teamId = UUID.randomUUID();

        Organization org = Organization.builder().id(orgId).build();
        User actorUser = User.builder().firstName("John").lastName("Doe").build();
        User targetUser = User.builder().firstName("Jane").lastName("Smith").build();
        Team team = Team.builder().id(teamId).build();
        Member actor = Member.builder().id(actorId).organization(org).user(actorUser).team(team).build();
        Member target = Member.builder().id(targetId).organization(org).user(targetUser).team(team).build();

        when(memberRepository.findById(actorId)).thenReturn(Optional.of(actor));
        when(memberRepository.findById(targetId)).thenReturn(Optional.of(target));
        when(notificationService.createReminderNotification(any(), any(), any(), any())).thenReturn(null);

        memberService.sendReminder(actorId, targetId);

        verify(notificationService).createReminderNotification(orgId, teamId, actorId, targetId);
    }

    @Test
    void sendReminder_shouldThrow_whenDifferentOrganizations() {
        UUID actorId = UUID.randomUUID();
        UUID targetId = UUID.randomUUID();

        Organization org1 = Organization.builder().id(UUID.randomUUID()).build();
        Organization org2 = Organization.builder().id(UUID.randomUUID()).build();
        Member actor = Member.builder().id(actorId).organization(org1).build();
        Member target = Member.builder().id(targetId).organization(org2).build();

        when(memberRepository.findById(actorId)).thenReturn(Optional.of(actor));
        when(memberRepository.findById(targetId)).thenReturn(Optional.of(target));

        assertThrows(IllegalArgumentException.class, () -> memberService.sendReminder(actorId, targetId));
    }
}
