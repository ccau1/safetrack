package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserContact;
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

        contact.setEmail(email);
        contact.setPhoneNumber(phoneNumber);
        contact.setAlternatePhoneNumber(alternatePhoneNumber);
        contact.setNextOfKinName(nextOfKinName);
        contact.setNextOfKinRelationship(nextOfKinRelationship);
        contact.setNextOfKinPhone(nextOfKinPhone);
        contact.setNextOfKinEmail(nextOfKinEmail);

        return userContactRepository.save(contact);
    }
}
