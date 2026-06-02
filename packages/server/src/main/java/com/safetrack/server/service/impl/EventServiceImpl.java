package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Event;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.repository.EventRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final OrganizationRepository organizationRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public Event createEvent(UUID organizationId, UUID createdByMemberId, String title,
                             String description, Event.EventType type, Instant startedAt) {
        Organization org = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        Member creator = memberRepository.findById(createdByMemberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (!creator.getOrganization().getId().equals(organizationId)) {
            throw new IllegalArgumentException("Creator is not a member of this organization");
        }

        Event event = Event.builder()
                .organization(org)
                .createdBy(creator)
                .title(title)
                .description(description)
                .type(type != null ? type : Event.EventType.EMERGENCY)
                .status(Event.EventStatus.ACTIVE)
                .startedAt(startedAt != null ? startedAt : Instant.now())
                .build();

        return eventRepository.save(event);
    }

    @Override
    public List<Event> findByOrganizationId(UUID organizationId) {
        return eventRepository.findByOrganizationIdOrderByStartedAtDesc(organizationId);
    }

    @Override
    public List<Event> findActiveByOrganizationId(UUID organizationId) {
        return eventRepository.findByOrganizationIdAndStatus(organizationId, Event.EventStatus.ACTIVE);
    }

    @Override
    public Optional<Event> findByIdAndOrganizationId(UUID id, UUID organizationId) {
        return eventRepository.findByIdAndOrganizationId(id, organizationId);
    }

    @Override
    public Optional<Event> findById(UUID id) {
        return eventRepository.findById(id);
    }

    @Override
    @Transactional
    public Event resolveEvent(UUID id, UUID organizationId) {
        Event event = eventRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        event.setStatus(Event.EventStatus.RESOLVED);
        event.setResolvedAt(Instant.now());
        return eventRepository.save(event);
    }

    @Override
    @Transactional
    public Event cancelEvent(UUID id, UUID organizationId) {
        Event event = eventRepository.findByIdAndOrganizationId(id, organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        event.setStatus(Event.EventStatus.CANCELLED);
        return eventRepository.save(event);
    }
}
