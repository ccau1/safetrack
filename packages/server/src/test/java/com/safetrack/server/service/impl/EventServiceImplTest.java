package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Event;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.repository.EventRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;
    @Mock
    private OrganizationRepository organizationRepository;
    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private EventServiceImpl eventService;

    @Test
    void createEvent_shouldCreateEvent() {
        UUID orgId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        Organization org = Organization.builder().id(orgId).build();
        Member member = Member.builder().id(memberId).organization(org).build();
        Event savedEvent = Event.builder().id(UUID.randomUUID()).title("Fire Drill").build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

        Event result = eventService.createEvent(orgId, memberId, "Fire Drill", "Test", Event.EventType.FIRE_DRILL, Instant.now());
        assertEquals("Fire Drill", result.getTitle());
    }

    @Test
    void createEvent_shouldUseDefaults_whenOptionalFieldsNull() {
        UUID orgId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        Organization org = Organization.builder().id(orgId).build();
        Member member = Member.builder().id(memberId).organization(org).build();
        Event savedEvent = Event.builder().id(UUID.randomUUID()).build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(eventRepository.save(any(Event.class))).thenReturn(savedEvent);

        eventService.createEvent(orgId, memberId, "Emergency", null, null, null);

        ArgumentCaptor<Event> captor = ArgumentCaptor.forClass(Event.class);
        verify(eventRepository).save(captor.capture());
        assertEquals(Event.EventType.EMERGENCY, captor.getValue().getType());
        assertEquals(Event.EventStatus.ACTIVE, captor.getValue().getStatus());
        assertNotNull(captor.getValue().getStartedAt());
    }

    @Test
    void createEvent_shouldThrow_whenOrganizationNotFound() {
        UUID orgId = UUID.randomUUID();
        when(organizationRepository.findById(orgId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                eventService.createEvent(orgId, UUID.randomUUID(), "Title", null, null, null));
    }

    @Test
    void createEvent_shouldThrow_whenMemberNotFound() {
        UUID orgId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(Organization.builder().id(orgId).build()));
        when(memberRepository.findById(memberId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                eventService.createEvent(orgId, memberId, "Title", null, null, null));
    }

    @Test
    void createEvent_shouldThrow_whenMemberNotInOrganization() {
        UUID orgId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        Organization org = Organization.builder().id(orgId).build();
        Member member = Member.builder().id(memberId).organization(Organization.builder().id(UUID.randomUUID()).build()).build();

        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));

        assertThrows(IllegalArgumentException.class, () ->
                eventService.createEvent(orgId, memberId, "Title", null, null, null));
    }

    @Test
    void findByOrganizationId_shouldReturnEvents() {
        UUID orgId = UUID.randomUUID();
        Event event = Event.builder().id(UUID.randomUUID()).build();
        when(eventRepository.findByOrganizationIdOrderByStartedAtDesc(orgId)).thenReturn(List.of(event));

        List<Event> result = eventService.findByOrganizationId(orgId);
        assertEquals(1, result.size());
    }

    @Test
    void findActiveByOrganizationId_shouldReturnActiveEvents() {
        UUID orgId = UUID.randomUUID();
        Event event = Event.builder().id(UUID.randomUUID()).status(Event.EventStatus.ACTIVE).build();
        when(eventRepository.findByOrganizationIdAndStatus(orgId, Event.EventStatus.ACTIVE)).thenReturn(List.of(event));

        List<Event> result = eventService.findActiveByOrganizationId(orgId);
        assertEquals(1, result.size());
    }

    @Test
    void resolveEvent_shouldSetStatusToResolved() {
        UUID eventId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        Event event = Event.builder().id(eventId).organization(Organization.builder().id(orgId).build()).status(Event.EventStatus.ACTIVE).build();

        when(eventRepository.findByIdAndOrganizationId(eventId, orgId)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(i -> i.getArgument(0));

        Event result = eventService.resolveEvent(eventId, orgId);
        assertEquals(Event.EventStatus.RESOLVED, result.getStatus());
        assertNotNull(result.getResolvedAt());
    }

    @Test
    void cancelEvent_shouldSetStatusToCancelled() {
        UUID eventId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        Event event = Event.builder().id(eventId).organization(Organization.builder().id(orgId).build()).status(Event.EventStatus.ACTIVE).build();

        when(eventRepository.findByIdAndOrganizationId(eventId, orgId)).thenReturn(Optional.of(event));
        when(eventRepository.save(any(Event.class))).thenAnswer(i -> i.getArgument(0));

        Event result = eventService.cancelEvent(eventId, orgId);
        assertEquals(Event.EventStatus.CANCELLED, result.getStatus());
    }

    @Test
    void resolveEvent_shouldThrow_whenEventNotFound() {
        UUID eventId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        when(eventRepository.findByIdAndOrganizationId(eventId, orgId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> eventService.resolveEvent(eventId, orgId));
    }
}
