package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserContact;
import com.safetrack.server.domain.repository.ContactPointRepository;
import com.safetrack.server.domain.repository.UserContactRepository;
import com.safetrack.server.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserContactServiceImplTest {

    @Mock
    private UserContactRepository userContactRepository;
    @Mock
    private ContactPointRepository contactPointRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserContactServiceImpl userContactService;

    @Test
    void findByUserId_shouldReturnContact() {
        UUID userId = UUID.randomUUID();
        UserContact contact = UserContact.builder().id(UUID.randomUUID()).build();
        when(userContactRepository.findByUserId(userId)).thenReturn(Optional.of(contact));

        Optional<UserContact> result = userContactService.findByUserId(userId);
        assertTrue(result.isPresent());
    }

    @Test
    void save_shouldReturnSavedContact() {
        UserContact contact = UserContact.builder().build();
        when(userContactRepository.save(contact)).thenReturn(contact);

        assertEquals(contact, userContactService.save(contact));
    }

    @Test
    void createOrUpdate_shouldCreateNewContact_whenNotExists() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).build();
        UserContact saved = UserContact.builder().id(UUID.randomUUID()).user(user).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userContactRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(contactPointRepository.findByUserIdAndType(any(), any())).thenReturn(Collections.emptyList());
        when(contactPointRepository.save(any(ContactPoint.class))).thenAnswer(i -> i.getArgument(0));
        when(userContactRepository.save(any(UserContact.class))).thenAnswer(i -> i.getArgument(0));

        UserContact result = userContactService.createOrUpdate(userId, "email@test.com", "123", "456", "Kin", "Spouse", "789", "kin@test.com");

        assertEquals("Kin", result.getNextOfKinName());
        assertEquals("Spouse", result.getNextOfKinRelationship());
        verify(contactPointRepository, times(5)).save(any(ContactPoint.class));
    }

    @Test
    void createOrUpdate_shouldUpdateExistingContact() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).build();
        UserContact existing = UserContact.builder().id(UUID.randomUUID()).user(user).build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userContactRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(contactPointRepository.findByUserIdAndType(any(), any())).thenReturn(Collections.emptyList());
        when(contactPointRepository.save(any(ContactPoint.class))).thenAnswer(i -> i.getArgument(0));
        when(userContactRepository.save(any(UserContact.class))).thenAnswer(i -> i.getArgument(0));

        UserContact result = userContactService.createOrUpdate(userId, "new@example.com", null, null, null, null, null, null);

        assertNotNull(result);
        verify(contactPointRepository, times(1)).save(any(ContactPoint.class));
    }

    @Test
    void createOrUpdate_shouldThrow_whenUserNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                userContactService.createOrUpdate(userId, "email@test.com", null, null, null, null, null, null));
    }
}
