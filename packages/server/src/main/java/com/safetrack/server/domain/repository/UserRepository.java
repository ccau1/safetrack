package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<User> findBySsoProviderAndSsoSubject(String ssoProvider, String ssoSubject);

    @EntityGraph(attributePaths = {"roles", "permissions"})
    Optional<User> findWithRolesAndPermissionsByEmail(String email);

    @EntityGraph(attributePaths = {"roles", "permissions"})
    Optional<User> findWithRolesAndPermissionsById(UUID id);
}
