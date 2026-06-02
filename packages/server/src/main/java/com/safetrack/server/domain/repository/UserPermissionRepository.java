package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, UUID> {

    List<UserPermission> findAllByUserId(UUID userId);

    List<UserPermission> findAllByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    Optional<UserPermission> findByUserIdAndAction(UUID userId, String action);

    Optional<UserPermission> findByUserIdAndActionAndOrganizationId(UUID userId, String action, UUID organizationId);

    void deleteByUserIdAndAction(UUID userId, String action);

    void deleteByUserIdAndActionAndOrganizationId(UUID userId, String action, UUID organizationId);

    boolean existsByUserIdAndAction(UUID userId, String action);
}
