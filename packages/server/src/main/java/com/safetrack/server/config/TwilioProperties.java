package com.safetrack.server.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Twilio configuration with sandbox support for local/dev/staging environments.
 */
@Configuration
@ConfigurationProperties(prefix = "twilio")
@Getter
@Setter
public class TwilioProperties {

    /** Twilio Account SID */
    private String accountSid = "";

    /** Twilio Auth Token */
    private String authToken = "";

    /** Twilio phone number for SMS and PSTN voice calls (E.164 format, e.g. +1234567890) */
    private String phoneNumber = "";

    /** Dedicated WhatsApp sender phone number for production (E.164 format).
     *  If left blank, falls back to {@link #phoneNumber} for backward compatibility. */
    private String whatsappPhoneNumber = "";

    /** When true, WhatsApp messages use the sandbox number and show sandbox warnings */
    private boolean whatsappSandboxEnabled = false;

    /** Twilio WhatsApp sandbox number (defaults to Twilio's shared sandbox) */
    private String whatsappSandboxNumber = "+14155238886";

    /** Public URL where Twilio fetches TwiML for voice calls */
    private String voiceCallbackUrl = "";

    public boolean isConfigured() {
        return accountSid != null && !accountSid.isBlank()
                && authToken != null && !authToken.isBlank()
                && phoneNumber != null && !phoneNumber.isBlank();
    }

    /**
     * Returns the appropriate "from" number for WhatsApp messaging.
     * In sandbox mode, uses the sandbox number.
     * In production, uses the dedicated WhatsApp phone number if configured,
     * otherwise falls back to the main Twilio phone number.
     */
    public String getWhatsAppFromNumber() {
        if (whatsappSandboxEnabled) {
            return whatsappSandboxNumber;
        }
        return (whatsappPhoneNumber != null && !whatsappPhoneNumber.isBlank())
                ? whatsappPhoneNumber
                : phoneNumber;
    }

    /**
     * Returns the appropriate "from" number for PSTN voice calls.
     * Always uses the main Twilio phone number.
     */
    public String getVoiceFromNumber() {
        return phoneNumber;
    }
}
