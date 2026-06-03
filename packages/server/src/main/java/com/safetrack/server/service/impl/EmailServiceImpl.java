package com.safetrack.server.service.impl;

import com.safetrack.server.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.invitation.base-url:http://localhost:3010}")
    private String baseUrl;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Async("taskExecutor")
    @Override
    public void sendInvitationEmail(String to, String token, String organizationName) {
        String inviteUrl = baseUrl + "/accept-invite?token=" + token;
        String subject = "You've been invited to join " + organizationName + " on SafeTrack";
        String html = buildHtmlEmail(organizationName, inviteUrl);

        if (mailHost == null || mailHost.isBlank()) {
            log.info("[DEV] Invitation email would be sent to: {} | Organization: {} | Link: {}", to, organizationName, inviteUrl);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.debug("Invitation email sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send invitation email to {}", to, e);
        }
    }

    private String buildHtmlEmail(String organizationName, String inviteUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>SafeTrack Invitation</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #F7F6F2; padding: 40px;">
                    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #E5E4E0; border-radius: 14px; padding: 32px;">
                        <h2 style="color: #1A1A1A; font-size: 20px; margin-bottom: 8px;">You're invited!</h2>
                        <p style="color: #8A8A8A; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                            You've been invited to join <strong style="color: #1A1A1A;">%s</strong> on SafeTrack.
                            Click the button below to accept your invitation.
                        </p>
                        <a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #4A5548; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
                            Accept Invitation
                        </a>
                        <p style="color: #8A8A8A; font-size: 12px; margin-top: 24px;">
                            This invitation expires in 24 hours. If you didn't expect this email, you can safely ignore it.
                        </p>
                    </div>
                </body>
                </html>
                """.formatted(organizationName, inviteUrl);
    }
}
