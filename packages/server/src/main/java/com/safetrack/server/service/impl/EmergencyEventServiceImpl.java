package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.*;
import com.safetrack.server.domain.repository.EmergencyEventRepository;
import com.safetrack.server.domain.repository.EmergencyEventUpdateRepository;
import com.safetrack.server.domain.repository.MemberGroupRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.TeamRepository;
import com.safetrack.server.service.EmergencyEventScopeResolver;
import com.safetrack.server.service.EmergencyEventService;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmergencyEventServiceImpl implements EmergencyEventService {

    private final EmergencyEventRepository emergencyEventRepository;
    private final EmergencyEventUpdateRepository emergencyEventUpdateRepository;
    private final OrganizationRepository organizationRepository;
    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final MemberGroupRepository memberGroupRepository;
    private final EmergencyEventScopeResolver scopeResolver;

    @Override
    @Transactional
    public EmergencyEvent createEvent(UUID organizationId, UUID createdByMemberId, String title,
                                      String description, EmergencyEvent.EmergencyEventType type, Instant startedAt,
                                      Set<UUID> targetTeamIds, Set<UUID> targetGroupIds) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        Member creator = memberRepository.findById(createdByMemberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (!creator.getOrganization().getId().equals(organizationId)) {
            throw new IllegalArgumentException("Creator is not a member of this organization");
        }

        EmergencyEvent event = EmergencyEvent.builder()
                .organization(org)
                .createdBy(creator)
                .title(title)
                .description(description)
                .type(type != null ? type : EmergencyEvent.EmergencyEventType.EMERGENCY)
                .status(EmergencyEvent.EmergencyEventStatus.ACTIVE)
                .startedAt(startedAt)
                .build();

        if (targetTeamIds != null && !targetTeamIds.isEmpty()) {
            Set<Team> teams = new HashSet<>(teamRepository.findAllById(targetTeamIds));
            for (Team team : teams) {
                if (!team.getOrganization().getId().equals(organizationId)) {
                    throw new IllegalArgumentException("Team does not belong to this organization");
                }
            }
            event.setTargetTeams(teams);
        }

        if (targetGroupIds != null && !targetGroupIds.isEmpty()) {
            Set<MemberGroup> groups = new HashSet<>(memberGroupRepository.findAllById(targetGroupIds));
            for (MemberGroup group : groups) {
                if (!group.getOrganization().getId().equals(organizationId)) {
                    throw new IllegalArgumentException("Group does not belong to this organization");
                }
            }
            event.setTargetGroups(groups);
        }

        return emergencyEventRepository.save(event);
    }

    @Override
    public List<EmergencyEvent> findByOrganizationId(UUID organizationId) {
        List<EmergencyEvent> events = emergencyEventRepository.findByOrganizationIdOrderByStartedAtDesc(organizationId);
        for (EmergencyEvent event : events) {
            Hibernate.initialize(event.getTargetTeams());
            Hibernate.initialize(event.getTargetGroups());
        }
        return events;
    }

    @Override
    public List<EmergencyEvent> findActiveByOrganizationId(UUID organizationId) {
        return emergencyEventRepository.findByOrganizationIdAndStatus(organizationId, EmergencyEvent.EmergencyEventStatus.ACTIVE);
    }

    @Override
    public Optional<EmergencyEvent> findByIdAndOrganizationId(UUID id, UUID organizationId) {
        Optional<EmergencyEvent> eventOpt = emergencyEventRepository.findByIdAndOrganizationId(id, organizationId);
        eventOpt.ifPresent(event -> {
            Hibernate.initialize(event.getTargetTeams());
            Hibernate.initialize(event.getTargetGroups());
        });
        return eventOpt;
    }

    @Override
    public Optional<EmergencyEvent> findById(UUID id) {
        Optional<EmergencyEvent> eventOpt = emergencyEventRepository.findById(id);
        eventOpt.ifPresent(event -> {
            Hibernate.initialize(event.getTargetTeams());
            Hibernate.initialize(event.getTargetGroups());
        });
        return eventOpt;
    }

    @Override
    @Transactional
    public EmergencyEvent resolveEvent(UUID id, UUID organizationId, String comment) {
        EmergencyEvent event = emergencyEventRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        Member resolver = memberRepository.findById(event.getCreatedBy().getId())
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        event.setStatus(EmergencyEvent.EmergencyEventStatus.RESOLVED);
        event.setResolvedAt(Instant.now());
        EmergencyEvent saved = emergencyEventRepository.save(event);

        EmergencyEventUpdate update = EmergencyEventUpdate.builder()
                .emergencyEvent(saved)
                .createdBy(resolver)
                .text(comment != null && !comment.isBlank() ? comment : "Event resolved")
                .type(EmergencyEventUpdate.UpdateType.RESOLVED)
                .build();
        emergencyEventUpdateRepository.save(update);

        return saved;
    }

    @Override
    @Transactional
    public EmergencyEvent cancelEvent(UUID id, UUID organizationId) {
        EmergencyEvent event = emergencyEventRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        event.setStatus(EmergencyEvent.EmergencyEventStatus.CANCELLED);
        return emergencyEventRepository.save(event);
    }

    @Override
    @Transactional
    public EmergencyEvent updateEvent(UUID id, UUID organizationId, String title, String description) {
        EmergencyEvent event = emergencyEventRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        event.setTitle(title);
        event.setDescription(description);
        return emergencyEventRepository.save(event);
    }

    @Override
    public List<Member> findMembersInScope(UUID eventId, UUID organizationId) {
        EmergencyEvent event = emergencyEventRepository.findByIdAndOrganizationId(eventId, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        Set<UUID> memberIds = scopeResolver.resolveMemberIds(event);
        if (memberIds.isEmpty()) {
            return List.of();
        }
        return memberRepository.findAllById(memberIds);
    }
}
