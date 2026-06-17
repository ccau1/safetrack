package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.ContactPointRepository;
import com.safetrack.server.domain.repository.UserRepository;
import com.safetrack.server.service.ContactPointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContactPointServiceImpl implements ContactPointService {

    private final ContactPointRepository contactPointRepository;
    private final UserRepository userRepository;

    @Override
    public List<ContactPoint> findByUserId(UUID userId) {
        return contactPointRepository.findByUserIdOrderByPriorityAsc(userId);
    }

    @Override
    public List<ContactPoint> findByUserIdAndType(UUID userId, ContactPoint.ContactPointType type) {
        return contactPointRepository.findByUserIdAndType(userId, type);
    }

    @Override
    public List<ContactPoint> findVerifiedByUserIdAndType(UUID userId, ContactPoint.ContactPointType type) {
        return contactPointRepository.findByUserIdAndTypeAndVerifiedAtIsNotNull(userId, type);
    }

    @Override
    public Optional<ContactPoint> findByIdAndUserId(UUID contactPointId, UUID userId) {
        return contactPointRepository.findByIdAndUserId(contactPointId, userId);
    }

    @Override
    @Transactional
    public ContactPoint addContactPoint(UUID userId, ContactPoint.ContactPointType type, String value, String label, ContactPoint.ContactPointCategory category) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String normalizedValue = normalizeValue(type, value);

        if (contactPointRepository.existsByUserIdAndTypeAndValue(userId, type, normalizedValue)) {
            throw new IllegalArgumentException("Contact point already exists");
        }

        int nextPriority = allocatePriority(userId, type);

        ContactPoint contactPoint = ContactPoint.builder()
                .user(user)
                .type(type)
                .value(normalizedValue)
                .label(label != null ? label : "Primary")
                .category(category != null ? category : ContactPoint.ContactPointCategory.SELF)
                .isPrimary(false)
                .priority(nextPriority)
                .build();

        return contactPointRepository.save(contactPoint);
    }

    @Override
    @Transactional
    public void deleteContactPoint(UUID userId, UUID contactPointId) {
        ContactPoint contactPoint = contactPointRepository.findByIdAndUserId(contactPointId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Contact point not found"));

        contactPointRepository.delete(contactPoint);
    }

    @Override
    @Transactional
    public void reorderContactPoints(UUID userId, List<UUID> orderedContactPointIds) {
        List<ContactPoint> points = contactPointRepository.findByUserId(userId);
        if (points.size() != orderedContactPointIds.size()) {
            throw new IllegalArgumentException("Invalid reorder request: size mismatch");
        }

        Set<UUID> userPointIds = points.stream()
                .map(ContactPoint::getId)
                .collect(Collectors.toSet());
        if (!userPointIds.containsAll(orderedContactPointIds)) {
            throw new IllegalArgumentException("Invalid reorder request: unknown contact point IDs");
        }

        // Enforce emergency policy: email cannot be the first contact method
        // when other channels exist.
        if (points.size() > 1) {
            UUID firstId = orderedContactPointIds.get(0);
            ContactPoint first = points.stream()
                    .filter(p -> p.getId().equals(firstId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Contact point not found"));
            if (first.getType() == ContactPoint.ContactPointType.EMAIL) {
                boolean hasNonEmail = points.stream()
                        .anyMatch(p -> p.getId() != firstId && p.getType() != ContactPoint.ContactPointType.EMAIL);
                if (hasNonEmail) {
                    throw new IllegalArgumentException(
                            "Email cannot be the first contact method when urgent channels (SMS, Phone, WhatsApp) are available."
                    );
                }
            }
        }

        for (int i = 0; i < orderedContactPointIds.size(); i++) {
            UUID id = orderedContactPointIds.get(i);
            ContactPoint cp = points.stream()
                    .filter(p -> p.getId().equals(id))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("Contact point not found"));
            cp.setPriority(i);
        }
        contactPointRepository.saveAll(points);
    }

    @Override
    public long countVerifiedByUserIdAndType(UUID userId, ContactPoint.ContactPointType type) {
        return contactPointRepository.countByUserIdAndTypeAndVerifiedAtIsNotNull(userId, type);
    }

    private int allocatePriority(UUID userId, ContactPoint.ContactPointType type) {
        List<ContactPoint> existing = contactPointRepository.findByUserIdOrderByPriorityAsc(userId);

        int desiredPriority;
        if (type == ContactPoint.ContactPointType.EMAIL) {
            // Email always appends at the end
            desiredPriority = existing.isEmpty() ? 0 : existing.get(existing.size() - 1).getPriority() + 1;
        } else {
            // Urgent channels are inserted before any email
            int lastNonEmailPriority = -1;
            for (ContactPoint cp : existing) {
                if (cp.getType() != ContactPoint.ContactPointType.EMAIL) {
                    lastNonEmailPriority = cp.getPriority();
                }
            }
            desiredPriority = lastNonEmailPriority >= 0 ? lastNonEmailPriority + 1 : 0;
        }

        // Shift existing points that would conflict to avoid ties
        for (ContactPoint cp : existing) {
            if (cp.getPriority() >= desiredPriority) {
                cp.setPriority(cp.getPriority() + 1);
            }
        }
        if (!existing.isEmpty()) {
            contactPointRepository.saveAll(existing);
        }

        return desiredPriority;
    }

    private String normalizeValue(ContactPoint.ContactPointType type, String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        if (type == ContactPoint.ContactPointType.EMAIL) {
            return trimmed.toLowerCase();
        }
        if (type == ContactPoint.ContactPointType.WHATSAPP && trimmed.startsWith("whatsapp:")) {
            return trimmed.substring("whatsapp:".length());
        }
        return trimmed;
    }
}
