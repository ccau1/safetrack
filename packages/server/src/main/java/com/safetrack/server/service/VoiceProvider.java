package com.safetrack.server.service;

public interface VoiceProvider {

    String initiateVoiceCall(String toPhoneNumber, String alertMessage);

    boolean isConfigured();
}
