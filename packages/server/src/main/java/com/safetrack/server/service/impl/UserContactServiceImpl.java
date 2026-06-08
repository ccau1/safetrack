package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserContact;
import com.safetrack.server.domain.repository.ContactPointRepository;
import com.safetrack.server.domain.repository.UserContactRepository;
import com.safetrack.server.domain.repository.UserRepository;
import com.safetrack.server.service.UserContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserContactServiceImpl implements UserContactService {

    private final UserContactRepository userContactRepository;
    private final ContactPointRepository contactPointRepository;
    private final UserRepository userRepository;

    @Override
    public Optional<UserContact> findByUserId(UUID userId) {
        return userContactRepository.findByUserId(userId);
    }

    @Override
    @Transactional
    public UserContact save(UserContact userContact) {
        return userContactRepository.save(userContact);
    }

    @Override
    @Transactional
    public UserContact createOrUpdate(UUID userId, String email, String phoneNumber,
                                      String alternatePhoneNumber, String nextOfKinName,
                                      String nextOfKinRelationship, String nextOfKinPhone,
                                      String nextOfKinEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        UserContact contact = userContactRepository.findByUserId(userId)
                .orElseGet(() -> UserContact.builder().user(user).build());

        contact.setNextOfKinName(nextOfKinName);
        contact.setNextOfKinRelationship(nextOfKinRelationship);

        if (email != null && !email.isBlank()) {
            ContactPoint cp = findOrCreateContactPoint(userId, ContactPoint.ContactPointType.EMAIL, email, "Primary", ContactPoint.ContactPointCategory.SELF);
            if (cp.getUser() == null) {
                cp.setUser(user);
            }
        }

        if (phoneNumber != null && !phoneNumber.isBlank()) {
            ContactPoint cp = findOrCreateContactPoint(userId, ContactPoint.ContactPointType.PHONE, phoneNumber, "Primary", ContactPoint.ContactPointCategory.SELF);
            if (cp.getUser() == null) {
                cp.setUser(user);
            }
        }

        if (alternatePhoneNumber != null && !alternatePhoneNumber.isBlank()) {
            ContactPoint cp = findOrCreateContactPoint(userId, ContactPoint.ContactPointType.PHONE, alternatePhoneNumber, "Alternate", ContactPoint.ContactPointCategory.SELF);
            if (cp.getUser() == null) {
                cp.setUser(user);
            }
        }

        if (nextOfKinPhone != null && !nextOfKinPhone.isBlank()) {
            ContactPoint cp = findOrCreateContactPoint(userId, ContactPoint.ContactPointType.PHONE, nextOfKinPhone, "Next of Kin", ContactPoint.ContactPointCategory.EMERGENCY_CONTACT);
            contact.setNextOfKinPhoneContactPoint(cp);
            if (cp.getUser() == null) {
                cp.setUser(user);
            }
        }

        if (nextOfKinEmail != null && !nextOfKinEmail.isBlank()) {
            ContactPoint cp = findOrCreateContactPoint(userId, ContactPoint.ContactPointType.EMAIL, nextOfKinEmail, "Next of Kin", ContactPoint.ContactPointCategory.EMERGENCY_CONTACT);
            contact.setNextOfKinEmailContactPoint(cp);
            if (cp.getUser() == null) {
                cp.setUser(user);
            }
        }

        return userContactRepository.save(contact);
    }

    private ContactPoint findOrCreateContactPoint(UUID userId, ContactPoint.ContactPointType type, String value, String label, ContactPoint.ContactPointCategory category) {
        String normalizedValue = normalizeValue(type, value);
        return contactPointRepository.findByUserIdAndType(userId, type).stream()
                .filter(cp -> cp.getValue().equalsIgnoreCase(normalizedValue))
                .findFirst()
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found"));
                    ContactPoint cp = ContactPoint.builder()
                            .user(user)
                            .type(type)
                            .value(normalizedValue)
                            .label(label)
                            .category(category)
                            .build();
                    return contactPointRepository.save(cp);
                });
    }

    private String normalizeValue(ContactPoint.ContactPointType type, String value) {
        if (value == null) {
            return null;
        }
        if (type == ContactPoint.ContactPointType.EMAIL) {
            return value.trim().toLowerCase();
        }
        return value.trim();
    }
}
