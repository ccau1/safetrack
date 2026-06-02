package com.safetrack.server.service;

import com.safetrack.server.domain.entity.User;

import java.util.Optional;
import java.util.UUID;

public interface UserService {
    Optional<User> findByEmail(String email);
    Optional<User> findById(UUID id);
    Optional<User> findWithRolesAndPermissionsByEmail(String email);
    Optional<User> findWithRolesAndPermissionsById(UUID id);
    boolean existsByEmail(String email);
    User save(User user);
    Optional<User> findOrCreateSsoUser(String email, String firstName, String lastName,
                                       String ssoProvider, String ssoSubject);
}
