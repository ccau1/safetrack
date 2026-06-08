package com.safetrack.server.service.impl;

import com.safetrack.server.config.TwilioProperties;
import com.safetrack.server.service.SmsProvider;
import com.safetrack.server.service.VoiceProvider;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class TwilioProvider implements SmsProvider, VoiceProvider {

    private final TwilioProperties twilioProperties;

    private boolean initialized = false;

    @PostConstruct
    public void init() {
        if (twilioProperties.isConfigured()) {
            Twilio.init(twilioProperties.getAccountSid(), twilioProperties.getAuthToken());
            initialized = true;
            log.info("Twilio provider initialized (sandbox={})", twilioProperties.isWhatsappSandboxEnabled());
        } else {
            log.info("Twilio credentials not configured. SMS/Voice/WhatsApp will be logged to console (dev mode).");
        }
    }

    @Override
    public boolean isConfigured() {
        return initialized;
    }

    @Override
    public void sendSms(String toPhoneNumber, String message) {
        if (!isConfigured()) {
            log.info("[DEV] SMS would be sent to: {} | Message: {}", toPhoneNumber, message);
            return;
        }

        try {
            Message.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(twilioProperties.getVoiceFromNumber()),
                    message
            ).create();
            log.debug("SMS sent to {}", toPhoneNumber);
        } catch (Exception e) {
            log.error("Failed to send SMS to {}", toPhoneNumber, e);
            throw new RuntimeException("Failed to send SMS", e);
        }
    }

    @Override
    public String initiateVoiceCall(String toPhoneNumber, String alertMessage) {
        if (!isConfigured()) {
            log.info("[DEV] Voice call would be made to: {} | Message: {}", toPhoneNumber, alertMessage);
            return "dev-call-sid-" + System.currentTimeMillis();
        }

        try {
            String callbackUrl = twilioProperties.getVoiceCallbackUrl();
            if (callbackUrl == null || callbackUrl.isBlank()) {
                throw new IllegalStateException("app.twilio.voice-callback-url is not configured. Voice calls require a public URL for TwiML.");
            }
            String twimlUrl = callbackUrl + "?message=" + URLEncoder.encode(alertMessage, StandardCharsets.UTF_8);

            Call call = Call.creator(
                    new PhoneNumber(toPhoneNumber),
                    new PhoneNumber(twilioProperties.getVoiceFromNumber()),
                    URI.create(twimlUrl)
            ).create();

            log.debug("Voice call initiated to {}, SID: {}", toPhoneNumber, call.getSid());
            return call.getSid();
        } catch (Exception e) {
            log.error("Failed to initiate voice call to {}", toPhoneNumber, e);
            throw new RuntimeException("Failed to initiate voice call", e);
        }
    }

    public void sendWhatsApp(String toPhoneNumber, String message) {
        if (!isConfigured()) {
            log.info("[DEV] WhatsApp would be sent to: {} | Message: {}", toPhoneNumber, message);
            return;
        }

        String fromNumber = twilioProperties.getWhatsAppFromNumber();

        if (twilioProperties.isWhatsappSandboxEnabled()) {
            log.info("[WhatsApp Sandbox] Sending from {} to {}", fromNumber, toPhoneNumber);
            log.info("[WhatsApp Sandbox] Ensure recipient has joined by sending 'join <code>' to {}", fromNumber);
        }

        try {
            Message.creator(
                    new PhoneNumber("whatsapp:" + normalizePhone(toPhoneNumber)),
                    new PhoneNumber("whatsapp:" + normalizePhone(fromNumber)),
                    message
            ).create();
            log.debug("WhatsApp message sent to {} from {}", toPhoneNumber, fromNumber);
        } catch (Exception e) {
            log.error("Failed to send WhatsApp to {} from {}", toPhoneNumber, fromNumber, e);
            if (twilioProperties.isWhatsappSandboxEnabled()) {
                log.error("WhatsApp Sandbox tip: Make sure the recipient has joined the sandbox by sending 'join <your-sandbox-code>' to {}", fromNumber);
            }
            throw new RuntimeException("Failed to send WhatsApp", e);
        }
    }

    /**
     * Initiates a voice call over WhatsApp.
     * Requires the recipient to have previously accepted a VOICE_CALL_REQUEST
     * or to be within an active messaging session.
     */
    public String initiateWhatsAppVoiceCall(String toPhoneNumber, String alertMessage) {
        if (!isConfigured()) {
            log.info("[DEV] WhatsApp voice call would be made to: {} | Message: {}", toPhoneNumber, alertMessage);
            return "dev-whatsapp-call-sid-" + System.currentTimeMillis();
        }

        if (twilioProperties.isWhatsappSandboxEnabled()) {
            log.warn("WhatsApp voice calls are NOT supported in sandbox mode. Falling back to PSTN voice call.");
            return initiateVoiceCall(toPhoneNumber, alertMessage);
        }

        try {
            String callbackUrl = twilioProperties.getVoiceCallbackUrl();
            if (callbackUrl == null || callbackUrl.isBlank()) {
                throw new IllegalStateException("app.twilio.voice-callback-url is not configured. Voice calls require a public URL for TwiML.");
            }
            String twimlUrl = callbackUrl
                    + "?message=" + URLEncoder.encode(alertMessage, StandardCharsets.UTF_8)
                    + "&channel=whatsapp";

            Call call = Call.creator(
                    new PhoneNumber("whatsapp:" + normalizePhone(toPhoneNumber)),
                    new PhoneNumber("whatsapp:" + normalizePhone(twilioProperties.getWhatsAppFromNumber())),
                    URI.create(twimlUrl)
            ).create();

            log.debug("WhatsApp voice call initiated to {}, SID: {}", toPhoneNumber, call.getSid());
            return call.getSid();
        } catch (Exception e) {
            log.error("Failed to initiate WhatsApp voice call to {}", toPhoneNumber, e);
            throw new RuntimeException("Failed to initiate WhatsApp voice call", e);
        }
    }

    private String normalizePhone(String phone) {
        if (phone == null) return "";
        return phone.replaceAll("[^+0-9]", "");
    }

    public String getFromPhoneNumber() {
        return twilioProperties.getPhoneNumber();
    }
}
