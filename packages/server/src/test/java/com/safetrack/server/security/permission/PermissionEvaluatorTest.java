package com.safetrack.server.security.permission;

import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserPermission;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.UserPermissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PermissionEvaluatorTest {

    @Mock
    private RolePolicyLoader policyLoader;

    @Mock
    private UserPermissionRepository userPermissionRepository;

    @Mock
    private MemberRepository memberRepository;

    @InjectMocks
    private PermissionEvaluator permissionEvaluator;

    private User user;
    private Role userRole;
    private UUID orgId;

    @BeforeEach
    void setUp() {
        userRole = Role.builder().id(UUID.randomUUID()).name(Role.RoleName.USER).build();
        user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .roles(Set.of(userRole))
                .permissions(Set.of())
                .build();
        orgId = UUID.randomUUID();
    }

    @Test
    void evaluate_shouldReturnTrue_forSuperAdmin() {
        Role superAdminRole = Role.builder().id(UUID.randomUUID()).name(Role.RoleName.SUPER_ADMIN).build();
        User admin = User.builder()
                .id(UUID.randomUUID())
                .roles(Set.of(superAdminRole))
                .permissions(Set.of())
                .build();

        assertTrue(permissionEvaluator.evaluate(admin, "any:action"));
    }

    @Test
    void evaluate_shouldReturnFalse_whenUserIsNull() {
        assertFalse(permissionEvaluator.evaluate(null, "action"));
    }

    @Test
    void evaluate_shouldReturnFalse_whenActionIsNull() {
        assertFalse(permissionEvaluator.evaluate(user, null));
    }

    @Test
    void evaluate_shouldReturnTrue_whenRolePolicyAllows() {
        RolePolicyLoader.Statement stmt = new RolePolicyLoader.Statement();
        ReflectionTestUtils.setField(stmt, "effect", RolePolicyLoader.Effect.Allow);
        ReflectionTestUtils.setField(stmt, "actions", List.of("safetrack:read"));
        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of(stmt));

        assertTrue(permissionEvaluator.evaluate(user, "safetrack:read"));
    }

    @Test
    void evaluate_shouldReturnFalse_whenRolePolicyDenies() {
        RolePolicyLoader.Statement denyStmt = new RolePolicyLoader.Statement();
        ReflectionTestUtils.setField(denyStmt, "effect", RolePolicyLoader.Effect.Deny);
        ReflectionTestUtils.setField(denyStmt, "actions", List.of("safetrack:delete"));
        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of(denyStmt));

        assertFalse(permissionEvaluator.evaluate(user, "safetrack:delete"));
    }

    @Test
    void evaluate_shouldReturnFalse_whenNoPoliciesMatch() {
        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of());

        assertFalse(permissionEvaluator.evaluate(user, "unknown:action"));
    }

    @Test
    void evaluate_shouldConsiderUserPermissions() {
        UserPermission userPerm = UserPermission.builder()
                .action("custom:action")
                .effect(UserPermission.Effect.Allow)
                .build();
        User userWithPerms = User.builder()
                .id(user.getId())
                .email(user.getEmail())
                .roles(Set.of(userRole))
                .permissions(Set.of(userPerm))
                .build();

        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of());

        assertTrue(permissionEvaluator.evaluate(userWithPerms, "custom:action"));
    }

    @Test
    void evaluate_denyShouldOverrideAllow() {
        RolePolicyLoader.Statement allowStmt = new RolePolicyLoader.Statement();
        ReflectionTestUtils.setField(allowStmt, "effect", RolePolicyLoader.Effect.Allow);
        ReflectionTestUtils.setField(allowStmt, "actions", List.of("safetrack:*"));

        RolePolicyLoader.Statement denyStmt = new RolePolicyLoader.Statement();
        ReflectionTestUtils.setField(denyStmt, "effect", RolePolicyLoader.Effect.Deny);
        ReflectionTestUtils.setField(denyStmt, "actions", List.of("safetrack:delete"));

        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of(allowStmt, denyStmt));

        assertFalse(permissionEvaluator.evaluate(user, "safetrack:delete"));
    }

    @Test
    void evaluate_orgAdmin_shouldHaveAdminPermissionsWithinOrg() {
        RolePolicyLoader.Statement adminStmt = new RolePolicyLoader.Statement();
        ReflectionTestUtils.setField(adminStmt, "effect", RolePolicyLoader.Effect.Allow);
        ReflectionTestUtils.setField(adminStmt, "actions", List.of("safetrack:*"));

        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of());
        when(policyLoader.getStatements(Role.RoleName.ADMIN)).thenReturn(List.of(adminStmt));

        Member member = Member.builder()
                .user(user)
                .orgRole(Member.OrgRole.ORG_ADMIN)
                .build();
        when(memberRepository.findByUserIdAndOrganizationId(user.getId(), orgId))
                .thenReturn(Optional.of(member));

        assertTrue(permissionEvaluator.evaluate(user, "safetrack:event:read", orgId));
        assertTrue(permissionEvaluator.evaluate(user, "safetrack:organization:delete", orgId));
    }

    @Test
    void evaluate_safetyOfficer_shouldHaveManagerPermissionsWithinOrg() {
        RolePolicyLoader.Statement managerStmt = new RolePolicyLoader.Statement();
        ReflectionTestUtils.setField(managerStmt, "effect", RolePolicyLoader.Effect.Allow);
        ReflectionTestUtils.setField(managerStmt, "actions", List.of("safetrack:event:read", "safetrack:event:manage"));

        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of());
        when(policyLoader.getStatements(Role.RoleName.MANAGER)).thenReturn(List.of(managerStmt));

        Member member = Member.builder()
                .user(user)
                .orgRole(Member.OrgRole.SAFETY_OFFICER)
                .build();
        when(memberRepository.findByUserIdAndOrganizationId(user.getId(), orgId))
                .thenReturn(Optional.of(member));

        assertTrue(permissionEvaluator.evaluate(user, "safetrack:event:read", orgId));
        assertTrue(permissionEvaluator.evaluate(user, "safetrack:event:manage", orgId));
    }

    @Test
    void evaluate_orgMember_shouldHaveUserPermissionsWithinOrg() {
        RolePolicyLoader.Statement userStmt = new RolePolicyLoader.Statement();
        ReflectionTestUtils.setField(userStmt, "effect", RolePolicyLoader.Effect.Allow);
        ReflectionTestUtils.setField(userStmt, "actions", List.of("safetrack:status:report"));

        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of(userStmt));

        Member member = Member.builder()
                .user(user)
                .orgRole(Member.OrgRole.ORG_MEMBER)
                .build();
        when(memberRepository.findByUserIdAndOrganizationId(user.getId(), orgId))
                .thenReturn(Optional.of(member));

        assertTrue(permissionEvaluator.evaluate(user, "safetrack:status:report", orgId));
    }

    @Test
    void evaluate_noMemberRecord_shouldNotGrantOrgPermissions() {
        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of());
        when(memberRepository.findByUserIdAndOrganizationId(user.getId(), orgId))
                .thenReturn(Optional.empty());

        assertFalse(permissionEvaluator.evaluate(user, "safetrack:event:read", orgId));
    }

    @Test
    void computeAllowedActions_shouldReturnWildcard_forSuperAdmin() {
        Role superAdminRole = Role.builder().id(UUID.randomUUID()).name(Role.RoleName.SUPER_ADMIN).build();
        User admin = User.builder()
                .id(UUID.randomUUID())
                .roles(Set.of(superAdminRole))
                .permissions(Set.of())
                .build();

        assertEquals(Set.of("*"), permissionEvaluator.computeAllowedActions(admin));
    }

    @Test
    void computeAllowedActions_shouldReturnEmptySet_forNullUser() {
        assertEquals(Set.of(), permissionEvaluator.computeAllowedActions(null));
    }

    @Test
    void computeAllowedActions_shouldCollectAllowedPatterns() {
        RolePolicyLoader.Statement stmt = new RolePolicyLoader.Statement();
        ReflectionTestUtils.setField(stmt, "effect", RolePolicyLoader.Effect.Allow);
        ReflectionTestUtils.setField(stmt, "actions", List.of("read", "write"));
        when(policyLoader.getStatements(Role.RoleName.USER)).thenReturn(List.of(stmt));

        Set<String> actions = permissionEvaluator.computeAllowedActions(user);
        assertTrue(actions.contains("read"));
        assertTrue(actions.contains("write"));
    }

    @Test
    void matches_shouldReturnTrue_forExactMatch() {
        assertTrue(PermissionEvaluator.matches("safetrack:read", "safetrack:read"));
    }

    @Test
    void matches_shouldReturnTrue_forWildcard() {
        assertTrue(PermissionEvaluator.matches("*", "safetrack:read"));
    }

    @Test
    void matches_shouldReturnTrue_forPrefixWildcard() {
        assertTrue(PermissionEvaluator.matches("safetrack:*", "safetrack:read"));
    }

    @Test
    void matches_shouldReturnFalse_forNullPattern() {
        assertFalse(PermissionEvaluator.matches(null, "action"));
    }

    @Test
    void matches_shouldReturnFalse_forNullAction() {
        assertFalse(PermissionEvaluator.matches("pattern", null));
    }

    @Test
    void matches_shouldReturnFalse_forNonMatchingPattern() {
        assertFalse(PermissionEvaluator.matches("safetrack:write", "safetrack:read"));
    }
}
