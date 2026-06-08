package com.safetrack.shared.security;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Data
@Validated
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {
    private String secret;
    private long expirationMs = 900000; // 15 minutes default

    @PostConstruct
    public void validate() {
        if (secret == null || secret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "app.jwt.secret must be at least 32 bytes (256 bits) for JWT HMAC-SHA security. " +
                "Current size: " + (secret == null ? 0 : secret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length) + " bytes. " +
                "Generate a secure key with: openssl rand -base64 48"
            );
        }
    }
}
