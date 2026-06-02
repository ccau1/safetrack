package com.safetrack.server.security;

import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    void loadUserByUsername_shouldReturnUserDetails_whenUserExists() {
        Role role = Role.builder().name(Role.RoleName.USER).build();
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .passwordHash("hashedpassword")
                .isActive(true)
                .roles(Set.of(role))
                .build();

        when(userService.findByEmail("test@example.com")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("test@example.com");

        assertEquals("test@example.com", details.getUsername());
        assertEquals("hashedpassword", details.getPassword());
        assertTrue(details.isEnabled());
        assertTrue(details.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_USER")));
    }

    @Test
    void loadUserByUsername_shouldUseEmptyPassword_whenPasswordHashIsNull() {
        Role role = Role.builder().name(Role.RoleName.ADMIN).build();
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("sso@example.com")
                .passwordHash(null)
                .isActive(true)
                .roles(Set.of(role))
                .build();

        when(userService.findByEmail("sso@example.com")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("sso@example.com");

        assertEquals("", details.getPassword());
    }

    @Test
    void loadUserByUsername_shouldThrow_whenUserNotFound() {
        when(userService.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class,
                () -> customUserDetailsService.loadUserByUsername("missing@example.com"));
    }

    @Test
    void loadUserByUsername_shouldReturnDisabled_whenUserInactive() {
        Role role = Role.builder().name(Role.RoleName.USER).build();
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("inactive@example.com")
                .passwordHash("hash")
                .isActive(false)
                .roles(Set.of(role))
                .build();

        when(userService.findByEmail("inactive@example.com")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("inactive@example.com");

        assertFalse(details.isEnabled());
    }
}
