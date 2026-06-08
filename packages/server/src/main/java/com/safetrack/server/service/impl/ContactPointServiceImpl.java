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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ContactPointServiceImpl implements ContactPointService {

    private final ContactPointRepository contactPointRepository;
    private final UserRepository userRepository;

    @Override
    public List<ContactPoint> findByUserId(UUID userId) {
        return contactPointRepository.findByUserId(userId);
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

        ContactPoint contactPoint = ContactPoint.builder()
                .user(user)
                .type(type)
                .value(normalizedValue)
                .label(label != null ? label : "Primary")
                .category(category != null ? category : ContactPoint.ContactPointCategory.SELF)
                .isPrimary(false)
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
    public long countVerifiedByUserIdAndType(UUID userId, ContactPoint.ContactPointType type) {
        return contactPointRepository.countByUserIdAndTypeAndVerifiedAtIsNotNull(userId, type);
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
