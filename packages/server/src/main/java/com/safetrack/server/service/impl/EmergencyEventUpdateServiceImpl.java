package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.EmergencyEvent;
import com.safetrack.server.domain.entity.EmergencyEventUpdate;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.repository.EmergencyEventRepository;
import com.safetrack.server.domain.repository.EmergencyEventUpdateRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.service.EmergencyEventUpdateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmergencyEventUpdateServiceImpl implements EmergencyEventUpdateService {

    private final EmergencyEventUpdateRepository emergencyEventUpdateRepository;
    private final EmergencyEventRepository emergencyEventRepository;
    private final MemberRepository memberRepository;

    @Override
    @Transactional
    public EmergencyEventUpdate createUpdate(UUID emergencyEventId, UUID createdByMemberId, String text,
                                             EmergencyEventUpdate.UpdateType type) {
        EmergencyEvent event = emergencyEventRepository.findById(emergencyEventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        Member creator = memberRepository.findById(createdByMemberId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        if (!creator.getOrganization().getId().equals(event.getOrganization().getId())) {
            throw new IllegalArgumentException("Creator is not a member of this organization");
        }

        EmergencyEventUpdate update = EmergencyEventUpdate.builder()
                .emergencyEvent(event)
                .createdBy(creator)
                .text(text)
                .type(type)
                .build();

        return emergencyEventUpdateRepository.save(update);
    }

    @Override
    public List<EmergencyEventUpdate> findByEmergencyEventId(UUID emergencyEventId) {
        return emergencyEventUpdateRepository.findByEmergencyEventIdOrderByCreatedAtDesc(emergencyEventId);
    }
}
