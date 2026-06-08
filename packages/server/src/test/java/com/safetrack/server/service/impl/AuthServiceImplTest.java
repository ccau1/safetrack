package com.safetrack.server.service.impl;

import com.safetrack.server.controller.dto.request.LoginRequest;
import com.safetrack.server.controller.dto.request.RegisterRequest;
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
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

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
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    void register_shouldCreateUserOrganizationAndMember() {
        RegisterRequest request = new RegisterRequest("john@example.com", "password", "John", "Doe", null, null);
        Role role = Role.builder().id(UUID.randomUUID()).name(Role.RoleName.USER).build();
        User savedUser = User.builder().id(UUID.randomUUID()).email("john@example.com").firstName("John").lastName("Doe").build();
        Organization savedOrg = Organization.builder().id(UUID.randomUUID()).name("John's Organization").slug("john-s-organization").build();

        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(roleRepository.findByName(Role.RoleName.USER)).thenReturn(Optional.of(role));
        when(passwordEncoder.encode("password")).thenReturn("hashed");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(organizationRepository.save(any(Organization.class))).thenReturn(savedOrg);
        when(organizationRepository.existsBySlug(anyString())).thenReturn(false);
        when(memberRepository.save(any(Member.class))).thenAnswer(i -> i.getArgument(0));

        User result = authService.register(request);

        assertEquals("john@example.com", result.getEmail());
        verify(userRepository).save(any(User.class));
        verify(organizationRepository).save(any(Organization.class));
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    void register_shouldThrow_whenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest("john@example.com", "password", "John", "Doe", null, null);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void register_shouldThrow_whenDefaultRoleMissing() {
        RegisterRequest request = new RegisterRequest("john@example.com", "password", "John", "Doe", null, null);
        when(userRepository.existsByEmail("john@example.com")).thenReturn(false);
        when(roleRepository.findByName(Role.RoleName.USER)).thenReturn(Optional.empty());

        assertThrows(IllegalStateException.class, () -> authService.register(request));
    }

    @Test
    void login_shouldReturnUser_whenCredentialsValid() {
        LoginRequest request = new LoginRequest("john@example.com", "password");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("john@example.com")
                .passwordHash("hashed")
                .isActive(true)
                .roles(Set.of())
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "hashed")).thenReturn(true);

        User result = authService.login(request);
        assertEquals("john@example.com", result.getEmail());
    }

    @Test
    void login_shouldThrow_whenUserNotFound() {
        LoginRequest request = new LoginRequest("missing@example.com", "password");
        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () -> authService.login(request));
    }

    @Test
    void login_shouldThrow_whenPasswordNull() {
        LoginRequest request = new LoginRequest("sso@example.com", "password");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("sso@example.com")
                .passwordHash(null)
                .isActive(true)
                .build();

        when(userRepository.findByEmail("sso@example.com")).thenReturn(Optional.of(user));

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void login_shouldThrow_whenPasswordMismatch() {
        LoginRequest request = new LoginRequest("john@example.com", "wrong");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("john@example.com")
                .passwordHash("hashed")
                .isActive(true)
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }

    @Test
    void login_shouldThrow_whenUserInactive() {
        LoginRequest request = new LoginRequest("john@example.com", "password");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("john@example.com")
                .passwordHash("hashed")
                .isActive(false)
                .build();

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("password", "hashed")).thenReturn(true);

        assertThrows(BadCredentialsException.class, () -> authService.login(request));
    }
}
