package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.VerificationChallenge;
import com.safetrack.server.service.VerificationChannel;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class WhatsAppVerificationChannel implements VerificationChannel {

    private final TwilioProvider twilioProvider;

    @Override
    public boolean supports(VerificationChallenge.Method method) {
        return method == VerificationChallenge.Method.WHATSAPP_CODE;
    }

    @Override
    public void dispatch(ContactPoint contactPoint, String rawTokenOrCode, VerificationChallenge.Method method) {
        String message = "Your SafeTrack verification code is: " + rawTokenOrCode + ". This code will expire in 15 minutes.";
        twilioProvider.sendWhatsApp(contactPoint.getValue(), message);
    }
}
