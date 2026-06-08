package com.safetrack.server.controller;

import com.safetrack.server.service.AlertReplyService;
import com.safetrack.server.service.VoiceScriptService;
import com.twilio.twiml.MessagingResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequiredArgsConstructor
public class TwilioWebhookController {

    private final AlertReplyService alertReplyService;
    private final VoiceScriptService voiceScriptService;

    /**
     * Returns TwiML for an outbound voice call.
     * Twilio fetches this URL when the call connects.
     */
    @GetMapping(value = "/api/webhooks/twilio/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> voiceResponse(
            @RequestParam String message,
            @RequestParam(required = false, defaultValue = "default") String script) {

        String twiml = voiceScriptService.generateOutboundCallTwiML(script, message);
        return ResponseEntity.ok(twiml);
    }

    /**
     * Receives DTMF input from a voice call.
     */
    @PostMapping(value = "/api/webhooks/twilio/voice/gather", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> voiceGather(HttpServletRequest request) {
        String fromNumber = stripWhatsAppPrefix(request.getParameter("From"));
        String digits = request.getParameter("Digits");
        String callSid = request.getParameter("CallSid");

        log.info("Voice gather from {}, digits: {}, callSid: {}", fromNumber, digits, callSid);

        boolean confirmed = digits != null && !digits.isBlank();
        if (confirmed) {
            alertReplyService.processReply(fromNumber, digits, callSid);
        }

        String twiml = voiceScriptService.generateGatherResponseTwiML(confirmed);
        return ResponseEntity.ok(twiml);
    }

    /**
     * Receives SMS and WhatsApp replies.
     */
    @PostMapping(value = "/api/webhooks/twilio/sms", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> smsReply(HttpServletRequest request) {
        String fromNumber = stripWhatsAppPrefix(request.getParameter("From"));
        String body = request.getParameter("Body");
        String messageSid = request.getParameter("MessageSid");

        log.info("SMS/WhatsApp reply from {}, body: {}, sid: {}", fromNumber, body, messageSid);

        alertReplyService.processReply(fromNumber, body, messageSid);

        MessagingResponse response = new MessagingResponse.Builder()
                .build();

        return ResponseEntity.ok(response.toXml());
    }

    /**
     * Handles inbound calls to our Twilio number (someone calls back).
     */
    @PostMapping(value = "/api/webhooks/twilio/voice/inbound", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> voiceInbound(HttpServletRequest request) {
        String fromNumber = stripWhatsAppPrefix(request.getParameter("From"));
        log.info("Inbound voice call from {}", fromNumber);

        String twiml = voiceScriptService.generateInboundCallTwiML();
        return ResponseEntity.ok(twiml);
    }

    private String stripWhatsAppPrefix(String number) {
        if (number != null && number.startsWith("whatsapp:")) {
            return number.substring("whatsapp:".length());
        }
        return number;
    }
}
