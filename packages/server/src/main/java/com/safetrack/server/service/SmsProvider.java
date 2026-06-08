package com.safetrack.server.service;

public interface SmsProvider {

    void sendSms(String phoneNumber, String message);

    boolean isConfigured();
}
