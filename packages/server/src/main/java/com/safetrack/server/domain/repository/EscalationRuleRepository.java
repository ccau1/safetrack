package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.EscalationRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EscalationRuleRepository extends JpaRepository<EscalationRule, UUID> {

    List<EscalationRule> findByUserId(UUID userId);

    Optional<EscalationRule> findByIdAndUserId(UUID id, UUID userId);

    Optional<EscalationRule> findByUserIdAndIsDefaultTrue(UUID userId);
}
