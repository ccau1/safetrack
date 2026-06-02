package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserContact;
import com.safetrack.server.domain.repository.UserContactRepository;
import com.safetrack.server.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
        when(userContactRepository.save(any(UserContact.class))).thenAnswer(i -> i.getArgument(0));

        UserContact result = userContactService.createOrUpdate(userId, "email@test.com", "123", "456", "Kin", "Spouse", "789", "kin@test.com");

        assertEquals("email@test.com", result.getEmail());
        assertEquals("123", result.getPhoneNumber());
        assertEquals("456", result.getAlternatePhoneNumber());
        assertEquals("Kin", result.getNextOfKinName());
        assertEquals("Spouse", result.getNextOfKinRelationship());
        assertEquals("789", result.getNextOfKinPhone());
        assertEquals("kin@test.com", result.getNextOfKinEmail());
    }

    @Test
    void createOrUpdate_shouldUpdateExistingContact() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).build();
        UserContact existing = UserContact.builder().id(UUID.randomUUID()).user(user).email("old@example.com").build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userContactRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(userContactRepository.save(any(UserContact.class))).thenAnswer(i -> i.getArgument(0));

        UserContact result = userContactService.createOrUpdate(userId, "new@example.com", null, null, null, null, null, null);

        assertEquals("new@example.com", result.getEmail());
    }

    @Test
    void createOrUpdate_shouldThrow_whenUserNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () ->
                userContactService.createOrUpdate(userId, "email@test.com", null, null, null, null, null, null));
    }
}
