package com.safetrack.server.service;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.VerificationChallenge;

import java.util.UUID;

public interface VerificationService {

    VerificationChallenge initiateVerification(UUID contactPointId, VerificationChallenge.Method method);

    ContactPoint verifyByToken(String rawToken);

    ContactPoint verifyByCode(UUID contactPointId, String rawCode);

    void resendVerification(UUID contactPointId, VerificationChallenge.Method method);
}
