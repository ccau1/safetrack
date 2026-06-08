package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.ContactPointRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.RoleRepository;
import com.safetrack.server.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private OrganizationRepository organizationRepository;
    @Mock
    private MemberRepository memberRepository;
    @Mock
    private ContactPointRepository contactPointRepository;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void findByEmail_shouldReturnUser() {
        User user = User.builder().id(UUID.randomUUID()).email("test@example.com").build();
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        Optional<User> result = userService.findByEmail("test@example.com");
        assertTrue(result.isPresent());
        assertEquals("test@example.com", result.get().getEmail());
    }

    @Test
    void findById_shouldReturnUser() {
        UUID id = UUID.randomUUID();
        User user = User.builder().id(id).email("test@example.com").build();
        when(userRepository.findById(id)).thenReturn(Optional.of(user));

        Optional<User> result = userService.findById(id);
        assertTrue(result.isPresent());
    }

    @Test
    void existsByEmail_shouldReturnTrue() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);
        assertTrue(userService.existsByEmail("test@example.com"));
    }

    @Test
    void save_shouldReturnSavedUser() {
        User user = User.builder().email("new@example.com").build();
        when(userRepository.save(user)).thenReturn(user);

        assertEquals(user, userService.save(user));
    }

    @Test
    void findOrCreateSsoUser_shouldReturnExisting_whenFoundByProviderAndSubject() {
        User existing = User.builder().id(UUID.randomUUID()).email("sso@example.com").ssoProvider("google").ssoSubject("123").build();
        when(userRepository.findBySsoProviderAndSsoSubject("google", "123")).thenReturn(Optional.of(existing));

        Optional<User> result = userService.findOrCreateSsoUser("sso@example.com", "John", "Doe", "google", "123");
        assertTrue(result.isPresent());
        assertEquals(existing, result.get());
    }

    @Test
    void findOrCreateSsoUser_shouldLinkSsoToExistingEmailAccount() {
        User existing = User.builder().id(UUID.randomUUID()).email("existing@example.com").build();
        when(userRepository.findBySsoProviderAndSsoSubject("google", "123")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("existing@example.com")).thenReturn(Optional.of(existing));
        when(userRepository.save(any(User.class))).thenAnswer(i -> i.getArgument(0));

        Optional<User> result = userService.findOrCreateSsoUser("existing@example.com", "John", "Doe", "google", "123");
        assertTrue(result.isPresent());
        assertEquals("google", result.get().getSsoProvider());
        assertEquals("123", result.get().getSsoSubject());
    }

    @Test
    void findOrCreateSsoUser_shouldCreateNewUser_whenNoExisting() {
        Role role = Role.builder().name(Role.RoleName.USER).build();
        User savedUser = User.builder().id(UUID.randomUUID()).email("new@example.com").build();
        Organization savedOrg = Organization.builder().id(UUID.randomUUID()).name("John's Organization").slug("john-s-organization").build();

        when(userRepository.findBySsoProviderAndSsoSubject("google", "456")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName(Role.RoleName.USER)).thenReturn(Optional.of(role));
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(organizationRepository.save(any(Organization.class))).thenReturn(savedOrg);
        when(organizationRepository.existsBySlug(anyString())).thenReturn(false);
        when(memberRepository.save(any(Member.class))).thenAnswer(i -> i.getArgument(0));

        Optional<User> result = userService.findOrCreateSsoUser("new@example.com", "John", "Doe", "google", "456");
        assertTrue(result.isPresent());
        verify(userRepository, times(2)).save(any(User.class));
        verify(organizationRepository).save(any(Organization.class));
        verify(memberRepository).save(any(Member.class));
        verify(contactPointRepository).save(any(ContactPoint.class));
    }

    @Test
    void findOrCreateSsoUser_shouldThrow_whenDefaultRoleMissing() {
        when(userRepository.findBySsoProviderAndSsoSubject("google", "456")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("new@example.com")).thenReturn(Optional.empty());
        when(roleRepository.findByName(Role.RoleName.USER)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class,
                () -> userService.findOrCreateSsoUser("new@example.com", "John", "Doe", "google", "456"));
    }
}
