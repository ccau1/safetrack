package com.safetrack.server.security.permission;

import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserPermission;
import com.safetrack.server.domain.repository.UserPermissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class PermissionEvaluator {

    private final RolePolicyLoader policyLoader;
    private final UserPermissionRepository userPermissionRepository;

    /**
     * Evaluate whether a user has permission for an action globally.
     * @deprecated Use {@link #evaluate(User, String, UUID)} for org-scoped checks.
     */
    @Deprecated
    public boolean evaluate(User user, String requestedAction) {
        return evaluate(user, requestedAction, null);
    }

    /**
     * Evaluate whether a user has permission for an action within a specific organization.
     * If orgId is null, only global permissions (org_id IS NULL) are checked.
     * SUPER_ADMIN always passes.
     */
    public boolean evaluate(User user, String requestedAction, UUID orgId) {
        if (user == null || requestedAction == null) {
            return false;
        }

        if (user.hasRole(Role.RoleName.SUPER_ADMIN)) {
            return true;
        }

        Set<String> allows = new HashSet<>();
        Set<String> denies = new HashSet<>();

        // 1. Role policies from YAML (global / role-based)
        for (Role role : user.getRoles()) {
            List<RolePolicyLoader.Statement> stmts = policyLoader.getStatements(role.getName());
            for (RolePolicyLoader.Statement stmt : stmts) {
                for (String actionPattern : stmt.getActions()) {
                    if (matches(actionPattern, requestedAction)) {
                        if (stmt.getEffect() == RolePolicyLoader.Effect.Deny) {
                            denies.add(requestedAction);
                        } else {
                            allows.add(requestedAction);
                        }
                    }
                }
            }
        }

        // 2. User-specific DB overrides — global first, then org-scoped
        for (UserPermission up : loadUserPermissions(user, orgId)) {
            if (matches(up.getAction(), requestedAction)) {
                if (up.getEffect() == UserPermission.Effect.Deny) {
                    denies.add(requestedAction);
                } else {
                    allows.add(requestedAction);
                }
            }
        }

        // 3. Deny-override logic (Explicit Deny > Explicit Allow > Implicit Deny)
        if (denies.contains(requestedAction)) {
            return false;
        }
        if (allows.contains(requestedAction)) {
            return true;
        }
        return false;
    }

    /**
     * Compute all allowed actions for a user globally.
     * @deprecated Use {@link #computeAllowedActions(User, UUID)} for org-scoped computation.
     */
    @Deprecated
    public Set<String> computeAllowedActions(User user) {
        return computeAllowedActions(user, null);
    }

    /**
     * Compute all allowed actions for a user within a specific organization.
     */
    public Set<String> computeAllowedActions(User user, UUID orgId) {
        if (user == null) {
            return Set.of();
        }

        if (user.hasRole(Role.RoleName.SUPER_ADMIN)) {
            return Set.of("*");
        }

        Set<String> allowed = new HashSet<>();
        Set<String> deniedPatterns = new HashSet<>();

        for (Role role : user.getRoles()) {
            List<RolePolicyLoader.Statement> stmts = policyLoader.getStatements(role.getName());
            for (RolePolicyLoader.Statement stmt : stmts) {
                if (stmt.getEffect() == RolePolicyLoader.Effect.Deny) {
                    deniedPatterns.addAll(stmt.getActions());
                } else {
                    allowed.addAll(stmt.getActions());
                }
            }
        }

        List<UserPermission> userPerms = loadUserPermissions(user, orgId);
        for (UserPermission up : userPerms) {
            if (up.getEffect() == UserPermission.Effect.Deny) {
                deniedPatterns.add(up.getAction());
            } else {
                allowed.add(up.getAction());
            }
        }

        return allowed;
    }

    /**
     * Load permissions for a user, scoped to an organization.
     * Global permissions (org_id IS NULL) are always included.
     * If orgId is provided, org-scoped permissions for that org are also included.
     */
    private List<UserPermission> loadUserPermissions(User user, UUID orgId) {
        Set<UserPermission> result = new HashSet<>();

        if (Hibernate.isInitialized(user.getPermissions())) {
            for (UserPermission up : user.getPermissions()) {
                if (up.getOrganization() == null) {
                    result.add(up);
                } else if (orgId != null && up.getOrganization().getId().equals(orgId)) {
                    result.add(up);
                }
            }
        } else {
            // Load global permissions
            result.addAll(userPermissionRepository.findAllByUserIdAndOrganizationId(user.getId(), null));
            // Load org-scoped permissions if orgId provided
            if (orgId != null) {
                result.addAll(userPermissionRepository.findAllByUserIdAndOrganizationId(user.getId(), orgId));
            }
        }

        return List.copyOf(result);
    }

    /**
     * Matches an action pattern against a concrete action.
     * Supports wildcards: "*" matches everything, "safetrack:*" matches any safetrack action.
     */
    public static boolean matches(String pattern, String action) {
        if (pattern == null || action == null) {
            return false;
        }
        if (pattern.equals("*") || pattern.equals(action)) {
            return true;
        }
        String regex = pattern.replace(".", "\\.").replace("*", ".*");
        return Pattern.matches(regex, action);
    }
}
