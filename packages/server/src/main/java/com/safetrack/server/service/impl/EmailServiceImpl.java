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

    @Value("${app.verification.base-url:${app.invitation.base-url:http://localhost:3010}}")
    private String verificationBaseUrl;

    @Value("${app.password-reset.base-url:${app.invitation.base-url:http://localhost:3010}}")
    private String passwordResetBaseUrl;

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

    @Async("taskExecutor")
    @Override
    public void sendVerificationEmail(String to, String codeOrLink, boolean isLink) {
        String subject = "Verify your contact on SafeTrack";
        String html;

        if (isLink) {
            String verifyUrl = verificationBaseUrl + "/verify-contact?token=" + codeOrLink;
            html = buildVerificationLinkEmail(verifyUrl);
            if (mailHost == null || mailHost.isBlank()) {
                log.info("[DEV] Verification email would be sent to: {} | Link: {}", to, verifyUrl);
                return;
            }
        } else {
            html = buildVerificationCodeEmail(codeOrLink);
            if (mailHost == null || mailHost.isBlank()) {
                log.info("[DEV] Verification email would be sent to: {} | Code: {}", to, codeOrLink);
                return;
            }
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.debug("Verification email sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send verification email to {}", to, e);
        }
    }

    private String buildVerificationLinkEmail(String verifyUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>SafeTrack Verification</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #F7F6F2; padding: 40px;">
                    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #E5E4E0; border-radius: 14px; padding: 32px;">
                        <h2 style="color: #1A1A1A; font-size: 20px; margin-bottom: 8px;">Verify your contact</h2>
                        <p style="color: #8A8A8A; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                            Please confirm this contact by clicking the button below.
                        </p>
                        <a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #4A5548; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
                            Verify Contact
                        </a>
                        <p style="color: #8A8A8A; font-size: 12px; margin-top: 24px;">
                            This link expires in 24 hours. If you didn't request this, you can safely ignore it.
                        </p>
                    </div>
                </body>
                </html>
                """.formatted(verifyUrl);
    }

    private String buildVerificationCodeEmail(String code) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>SafeTrack Verification</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #F7F6F2; padding: 40px;">
                    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #E5E4E0; border-radius: 14px; padding: 32px;">
                        <h2 style="color: #1A1A1A; font-size: 20px; margin-bottom: 8px;">Verify your contact</h2>
                        <p style="color: #8A8A8A; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                            Use the code below to verify your contact on SafeTrack.
                        </p>
                        <div style="padding: 16px; background-color: #F7F6F2; border-radius: 10px; text-align: center; font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #1A1A1A;">
                            %s
                        </div>
                        <p style="color: #8A8A8A; font-size: 12px; margin-top: 24px;">
                            This code expires in 15 minutes. If you didn't request this, you can safely ignore it.
                        </p>
                    </div>
                </body>
                </html>
                """.formatted(code);
    }

    @Async("taskExecutor")
    @Override
    public void sendPasswordResetEmail(String to, String token) {
        String resetUrl = passwordResetBaseUrl + "/reset-password?token=" + token;
        String subject = "Reset your SafeTrack password";
        String html = buildPasswordResetEmail(resetUrl);

        if (mailHost == null || mailHost.isBlank()) {
            log.info("[DEV] Password reset email would be sent to: {} | Link: {}", to, resetUrl);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            log.debug("Password reset email sent to {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send password reset email to {}", to, e);
        }
    }

    private String buildPasswordResetEmail(String resetUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <title>Reset your SafeTrack password</title>
                </head>
                <body style="font-family: Arial, sans-serif; background-color: #F7F6F2; padding: 40px;">
                    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #E5E4E0; border-radius: 14px; padding: 32px;">
                        <h2 style="color: #1A1A1A; font-size: 20px; margin-bottom: 8px;">Reset your password</h2>
                        <p style="color: #8A8A8A; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
                            We received a request to reset your SafeTrack password. Click the button below to set a new password.
                        </p>
                        <a href="%s" style="display: inline-block; padding: 12px 24px; background-color: #4A5548; color: #ffffff; text-decoration: none; border-radius: 10px; font-size: 14px; font-weight: 600;">
                            Reset Password
                        </a>
                        <p style="color: #8A8A8A; font-size: 12px; margin-top: 24px;">
                            This link expires in 2 hours. If you didn't request this, you can safely ignore it.
                        </p>
                    </div>
                </body>
                </html>
                """.formatted(resetUrl);
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
