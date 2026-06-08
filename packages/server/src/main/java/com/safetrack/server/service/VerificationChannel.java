package com.safetrack.server.service;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.VerificationChallenge;

public interface VerificationChannel {

    boolean supports(VerificationChallenge.Method method);

    void dispatch(ContactPoint contactPoint, String rawTokenOrCode, VerificationChallenge.Method method);
}
