package com.safetrack.server.domain.repository;

import com.safetrack.server.domain.entity.EscalationRuleStep;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EscalationRuleStepRepository extends JpaRepository<EscalationRuleStep, UUID> {

    List<EscalationRuleStep> findByEscalationRuleIdOrderByStepOrderAsc(UUID escalationRuleId);
}
