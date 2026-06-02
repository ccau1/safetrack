package com.safetrack.shared.dto;

import java.time.Instant;

/**
 * Standardized API error response.
 *
 * @param code      Machine-readable error code (e.g., VALIDATION_FAILED, AUTH_INVALID_CREDENTIALS)
 * @param message   Human-readable default message (fallback when frontend has no locale mapping)
 * @param reason    Detailed description or tracing of why the error occurred
 * @param path      Request path that triggered the error
 * @param timestamp When the error occurred
 * @param status    HTTP status code
 */
public record ApiError(
    String code,
    String message,
    String reason,
    String path,
    Instant timestamp,
    int status
) {
    public ApiError(String code, String message, String reason, String path, int status) {
        this(code, message, reason, path, Instant.now(), status);
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String code = "INTERNAL_ERROR";
        private String message = "An unexpected error occurred";
        private String reason = "";
        private String path = "";
        private int status = 500;

        public Builder code(String code) {
            this.code = code;
            return this;
        }

        public Builder message(String message) {
            this.message = message;
            return this;
        }

        public Builder reason(String reason) {
            this.reason = reason;
            return this;
        }

        public Builder path(String path) {
            this.path = path;
            return this;
        }

        public Builder status(int status) {
            this.status = status;
            return this;
        }

        public ApiError build() {
            return new ApiError(code, message, reason, path, timestamp, status);
        }

        private Instant timestamp = Instant.now();
    }
}
