package com.safetrack.shared.exception;

/**
 * Base exception for all domain errors in SafeTrack.
 * Carries a machine-readable code and a detailed reason for frontend/tracing use.
 */
public class BaseException extends RuntimeException {

    private final String code;
    private final String reason;

    public BaseException(String code, String message) {
        super(message);
        this.code = code;
        this.reason = message;
    }

    public BaseException(String code, String message, String reason) {
        super(message);
        this.code = code;
        this.reason = reason;
    }

    public BaseException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.reason = cause != null ? cause.getMessage() : message;
    }

    public BaseException(String code, String message, String reason, Throwable cause) {
        super(message, cause);
        this.code = code;
        this.reason = reason;
    }

    public String getCode() {
        return code;
    }

    public String getReason() {
        return reason;
    }
}
