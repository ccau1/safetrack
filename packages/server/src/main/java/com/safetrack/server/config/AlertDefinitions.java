package com.safetrack.server.config;

import com.safetrack.server.domain.entity.MemberEmergencyStatusReport.MemberEmergencyStatus;
import lombok.Getter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Central definitions for alert dispatch, escalation, and member replies.
 * Configurable via application.yml under the {@code app.alert} prefix.
 */
@Configuration
@ConfigurationProperties(prefix = "app.alert")
@Getter
public class AlertDefinitions {

    /**
     * Number → Status mapping for member replies (SMS, voice DTMF, WhatsApp).
     * Example: 1 → SAFE, 2 → NEEDS_HELP
     */
    private Map<String, MemberEmergencyStatus> replyStatusMap = Map.of(
            "1", MemberEmergencyStatus.SAFE,
            "2", MemberEmergencyStatus.NEEDS_HELP,
            "3", MemberEmergencyStatus.EN_ROUTE
    );

    /**
     * Keyword → Status mapping for text replies (case-insensitive).
     * Example: "safe" → SAFE, "help" → NEEDS_HELP
     */
    private Map<String, MemberEmergencyStatus> replyKeywordMap = Map.of(
            "safe", MemberEmergencyStatus.SAFE,
            "ok", MemberEmergencyStatus.SAFE,
            "help", MemberEmergencyStatus.NEEDS_HELP,
            "distress", MemberEmergencyStatus.NEEDS_HELP,
            "missing", MemberEmergencyStatus.MISSING,
            "enroute", MemberEmergencyStatus.EN_ROUTE,
            "coming", MemberEmergencyStatus.EN_ROUTE
    );

    /**
     * Default escalation rule steps (in minutes) when a user has not defined their own.
     * Each entry is: channel → wait-minutes
     * A special key "supervisor" means notify the member's supervisor.
     */
    private Map<String, Integer> defaultEscalationSteps = Map.of(
            "SMS", 5,
            "WHATSAPP", 5,
            "PHONE", 10,
            "supervisor", 15
    );

    /**
     * Legacy channel message templates.
     * Prefer {@link #whatsappMessageTemplates} for WhatsApp and {@link #voiceScriptTemplates} for voice.
     */
    private Map<String, String> channelMessageTemplates = Map.of(
            "SMS", "SafeTrack Alert: {{message}} Reply 1=SAFE, 2=HELP, 3=EN_ROUTE",
            "PHONE", "This is a SafeTrack emergency alert. {{message}}. Press 1 if you are safe. Press 2 if you need help. Press 3 if you are on your way.",
            "EMAIL", "SafeTrack Alert: {{message}}"
    );

    /**
     * WhatsApp message templates. The key is the template name; value is the message text.
     * Placeholder {@code {{message}}} is replaced with the alert text.
     * For WhatsApp Business API, these should match pre-approved template names
     * or be used for session-based messages (within 24h window).
     */
    private Map<String, String> whatsappMessageTemplates = Map.of(
            "default", "🚨 SafeTrack Alert: {{message}}\n\nReply with a number:\n1️⃣ = SAFE\n2️⃣ = NEEDS HELP\n3️⃣ = EN ROUTE",
            "minimal", "SafeTrack: {{message}}. Reply 1=SAFE 2=HELP 3=EN_ROUTE",
            "emergency_contact", "[EMERGENCY] SafeTrack alert regarding {{message}}. Please reply 1=SAFE 2=HELP."
    );

    /**
     * Voice call script templates. The key is the script name; value is the spoken text.
     * Placeholder {@code {{message}}} is replaced with the alert text.
     * These are used to generate TwiML {@code <Say>} content.
     */
    private Map<String, String> voiceScriptTemplates = Map.of(
            "default", "This is a SafeTrack emergency alert. {{message}}. Press 1 if you are safe. Press 2 if you need help. Press 3 if you are on your way.",
            "short", "SafeTrack alert: {{message}}. Press 1 for safe, 2 for help, 3 for en route.",
            "urgent", "Urgent SafeTrack alert. {{message}}. Please press 1 if you are safe, 2 if you need immediate help, or 3 if you are on your way."
    );

    /**
     * The Twilio phone number used for all outbound alerts and inbound replies.
     * If not set explicitly, the app should use the value from TwilioProperties.
     */
    private String replyPhoneNumber = "";

    public void setReplyStatusMap(Map<String, MemberEmergencyStatus> replyStatusMap) {
        this.replyStatusMap = replyStatusMap;
    }

    public void setReplyKeywordMap(Map<String, MemberEmergencyStatus> replyKeywordMap) {
        this.replyKeywordMap = replyKeywordMap;
    }

    public void setDefaultEscalationSteps(Map<String, Integer> defaultEscalationSteps) {
        this.defaultEscalationSteps = defaultEscalationSteps;
    }

    public void setChannelMessageTemplates(Map<String, String> channelMessageTemplates) {
        this.channelMessageTemplates = channelMessageTemplates;
    }

    public void setWhatsappMessageTemplates(Map<String, String> whatsappMessageTemplates) {
        this.whatsappMessageTemplates = whatsappMessageTemplates;
    }

    public void setVoiceScriptTemplates(Map<String, String> voiceScriptTemplates) {
        this.voiceScriptTemplates = voiceScriptTemplates;
    }

    public void setReplyPhoneNumber(String replyPhoneNumber) {
        this.replyPhoneNumber = replyPhoneNumber;
    }

    public MemberEmergencyStatus resolveReply(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }
        String normalized = input.trim();

        // Try numeric mapping first
        if (replyStatusMap.containsKey(normalized)) {
            return replyStatusMap.get(normalized);
        }

        // Try keyword mapping
        String keyword = normalized.toLowerCase().replaceAll("[^a-z]", "");
        return replyKeywordMap.get(keyword);
    }

    public String formatMessage(String channel, String alertMessage) {
        String template = channelMessageTemplates.getOrDefault(channel, "{{message}}");
        return template.replace("{{message}}", alertMessage != null ? alertMessage : "");
    }

    public String getWhatsAppMessage(String templateKey, String alertMessage) {
        String template = whatsappMessageTemplates.getOrDefault(templateKey, whatsappMessageTemplates.get("default"));
        return template.replace("{{message}}", alertMessage != null ? alertMessage : "");
    }

    public String getVoiceScript(String scriptKey, String alertMessage) {
        String template = voiceScriptTemplates.getOrDefault(scriptKey, voiceScriptTemplates.get("default"));
        return template.replace("{{message}}", alertMessage != null ? alertMessage : "");
    }
}
