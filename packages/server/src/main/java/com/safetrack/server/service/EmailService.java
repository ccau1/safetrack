package com.safetrack.server.service;

public interface EmailService {
    void sendInvitationEmail(String to, String token, String organizationName);
}
