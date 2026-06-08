package com.safetrack.server.service;

import com.safetrack.server.config.AlertDefinitions;
import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Gather;
import com.twilio.twiml.voice.Say;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class VoiceScriptService {

    private final AlertDefinitions alertDefinitions;

    /**
     * Generates TwiML for an outbound voice call.
     *
     * @param scriptKey   the template key (e.g. "default", "short")
     * @param alertMessage the alert message to embed
     * @return XML string of TwiML
     */
    public String generateOutboundCallTwiML(String scriptKey, String alertMessage) {
        String script = alertDefinitions.getVoiceScript(scriptKey, alertMessage);

        Say say = new Say.Builder(script).build();
        Gather gather = new Gather.Builder()
                .say(say)
                .action("/api/webhooks/twilio/voice/gather")
                .numDigits(1)
                .timeout(10)
                .build();

        VoiceResponse response = new VoiceResponse.Builder()
                .gather(gather)
                .say(new Say.Builder("We didn't receive any input. Goodbye.").build())
                .build();

        return response.toXml();
    }

    /**
     * Generates TwiML for an inbound voice call (someone calling back).
     *
     * @return XML string of TwiML
     */
    public String generateInboundCallTwiML() {
        Say greeting = new Say.Builder(
                "You have reached SafeTrack. Press 1 if you are safe. Press 2 if you need help. Press 3 if you are on your way."
        ).build();

        Gather gather = new Gather.Builder()
                .say(greeting)
                .action("/api/webhooks/twilio/voice/gather")
                .numDigits(1)
                .timeout(10)
                .build();

        VoiceResponse response = new VoiceResponse.Builder()
                .gather(gather)
                .say(new Say.Builder("We didn't receive any input. Goodbye.").build())
                .build();

        return response.toXml();
    }

    /**
     * Generates TwiML for the gather response after receiving DTMF input.
     *
     * @param confirmed whether a valid digit was received
     * @return XML string of TwiML
     */
    public String generateGatherResponseTwiML(boolean confirmed) {
        String text = confirmed
                ? "Thank you. Your status has been recorded."
                : "No input received. Goodbye.";

        VoiceResponse response = new VoiceResponse.Builder()
                .say(new Say.Builder(text).build())
                .build();

        return response.toXml();
    }
}
