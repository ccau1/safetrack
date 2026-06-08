package com.safetrack.server.service;

public interface AlertChannelProvider {

    void sendSms(String toPhoneNumber, String message);

    String initiateVoiceCall(String toPhoneNumber, String alertMessage);

    boolean isConfigured();
}
