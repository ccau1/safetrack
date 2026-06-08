package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.VerificationChallenge;
import com.safetrack.server.service.EmailService;
import com.safetrack.server.service.VerificationChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EmailVerificationChannel implements VerificationChannel {

    private final EmailService emailService;

    @Override
    public boolean supports(VerificationChallenge.Method method) {
        return method == VerificationChallenge.Method.EMAIL_LINK || method == VerificationChallenge.Method.EMAIL_CODE;
    }

    @Override
    public void dispatch(ContactPoint contactPoint, String rawTokenOrCode, VerificationChallenge.Method method) {
        boolean isLink = method == VerificationChallenge.Method.EMAIL_LINK;
        emailService.sendVerificationEmail(contactPoint.getValue(), rawTokenOrCode, isLink);
    }
}
