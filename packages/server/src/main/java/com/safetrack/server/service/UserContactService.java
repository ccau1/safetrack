package com.safetrack.server.service;

import com.safetrack.server.domain.entity.UserContact;

import java.util.Optional;
import java.util.UUID;

public interface UserContactService {
    Optional<UserContact> findByUserId(UUID userId);

    UserContact save(UserContact userContact);

    UserContact createOrUpdate(UUID userId, String email, String phoneNumber,
                               String alternatePhoneNumber, String nextOfKinName,
                               String nextOfKinRelationship, String nextOfKinPhone,
                               String nextOfKinEmail);
}
