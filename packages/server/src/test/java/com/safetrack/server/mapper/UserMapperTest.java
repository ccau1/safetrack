package com.safetrack.server.mapper;

import com.safetrack.server.controller.dto.response.AuthResponse;
import com.safetrack.server.controller.dto.response.UserResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class UserMapperTest {

    private final UserMapper userMapper = new UserMapperImpl();

    @Test
    void toResponse_shouldMapUser() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .isActive(true)
                .roles(Set.of())
                .build();

        UserResponse response = userMapper.toResponse(user);

        assertEquals(user.getId(), response.id());
        assertEquals("test@example.com", response.email());
        assertEquals("John", response.firstName());
        assertEquals("Doe", response.lastName());
        assertTrue(response.active());
    }

    @Test
    void toAuthResponse_shouldMapUserAndMembers() {
        UUID userId = UUID.randomUUID();
        UUID orgId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .roles(Set.of(Role.builder().name(Role.RoleName.USER).build()))
                .build();

        Organization org = Organization.builder().id(orgId).name("My Org").slug("my-org").build();
        Member member = Member.builder()
                .id(UUID.randomUUID())
                .organization(org)
                .orgRole(Member.OrgRole.ORG_ADMIN)
                .build();

        AuthResponse response = userMapper.toAuthResponse(user, List.of(member), List.of("read", "write"));

        assertEquals(userId, response.userId());
        assertEquals("test@example.com", response.email());
        assertEquals(List.of("USER"), response.roles());
        assertEquals(List.of("read", "write"), response.actions());
        assertNotNull(response.organization());
        assertEquals(orgId, response.organization().id());
        assertEquals(1, response.organizations().size());
    }

    @Test
    void toAuthResponse_shouldHandleEmptyMembers() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .firstName("John")
                .lastName("Doe")
                .roles(Set.of())
                .build();

        AuthResponse response = userMapper.toAuthResponse(user, List.of(), List.of());

        assertNull(response.organization());
        assertTrue(response.organizations().isEmpty());
    }

    @Test
    void mapRoles_shouldReturnEmptyList_whenRolesNull() {
        assertTrue(userMapper.mapRoles(null).isEmpty());
    }

    @Test
    void mapRoles_shouldMapRoleNames() {
        Set<Role> roles = Set.of(
                Role.builder().name(Role.RoleName.USER).build(),
                Role.builder().name(Role.RoleName.ADMIN).build()
        );

        List<String> result = userMapper.mapRoles(roles);
        assertEquals(2, result.size());
        assertTrue(result.contains("USER"));
        assertTrue(result.contains("ADMIN"));
    }
}
