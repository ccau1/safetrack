package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.UserContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserContactRepository extends JpaRepository<UserContact, UUID> {
    Optional<UserContact> findByUserId(UUID userId);
    boolean existsByUserId(UUID userId);
}
