package com.safetrack.server.security.permission;

import com.safetrack.server.domain.entity.User;
import com.safetrack.server.security.JwtAuthenticationDetails;
import com.safetrack.server.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.UUID;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class RequireActionAspect {

    private final PermissionEvaluator permissionEvaluator;
    private final UserService userService;

    @Around("@annotation(requireAction)")
    public Object around(ProceedingJoinPoint pjp, RequireAction requireAction) throws Throwable {
        String requestedAction = requireAction.value();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("Authentication required");
        }

        UUID pathOrgId = extractOrgIdFromArgs(pjp);
        UUID jwtOrgId = null;

        // Fast path: check JWT actions claim if available
        if (authentication.getDetails() instanceof JwtAuthenticationDetails details) {
            Set<String> jwtActions = details.actions();
            if (hasMatchingAction(jwtActions, requestedAction)) {
                return pjp.proceed();
            }
            jwtOrgId = details.organizationId();
        } else if (authentication.getDetails() instanceof Set<?> details) {
            @SuppressWarnings("unchecked")
            Set<String> jwtActions = (Set<String>) details;
            if (hasMatchingAction(jwtActions, requestedAction)) {
                return pjp.proceed();
            }
        }

        // Prefer path orgId for org-scoped endpoints, fall back to JWT orgId
        UUID orgId = pathOrgId != null ? pathOrgId : jwtOrgId;

        Object principal = authentication.getPrincipal();
        String email = null;
        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else if (principal instanceof String s) {
            email = s;
        }

        if (email == null) {
            throw new AccessDeniedException("Unable to identify user");
        }

        User user = userService.findWithRolesAndPermissionsByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        if (!permissionEvaluator.evaluate(user, requestedAction, orgId)) {
            log.warn("Access denied for user {} on action {} (org={})", email, requestedAction, orgId);
            throw new AccessDeniedException("Missing action: " + requestedAction);
        }

        return pjp.proceed();
    }

    private boolean hasMatchingAction(Set<String> jwtActions, String requestedAction) {
        for (String action : jwtActions) {
            if (PermissionEvaluator.matches(action, requestedAction)) {
                return true;
            }
        }
        return false;
    }

    private UUID extractOrgIdFromArgs(ProceedingJoinPoint pjp) {
        if (pjp.getSignature() instanceof MethodSignature signature) {
            String[] paramNames = signature.getParameterNames();
            Object[] args = pjp.getArgs();
            if (paramNames != null && args != null) {
                for (int i = 0; i < paramNames.length; i++) {
                    if ("orgId".equals(paramNames[i]) && args[i] instanceof UUID uuid) {
                        return uuid;
                    }
                }
            }
        }
        return null;
    }
}
