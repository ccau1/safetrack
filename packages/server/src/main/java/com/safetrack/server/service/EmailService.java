package com.safetrack.server.service;

public interface EmailService {
    void sendInvitationEmail(String to, String token, String organizationName);

    void sendVerificationEmail(String to, String codeOrLink, boolean isLink);

    void sendPasswordResetEmail(String to, String token);
}
