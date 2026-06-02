package com.safetrack.shared.exception;

public class ValidationException extends BaseException {

    public ValidationException(String message) {
        super("VALIDATION_FAILED", message);
    }

    public ValidationException(String message, String reason) {
        super("VALIDATION_FAILED", message, reason);
    }

    public ValidationException(String message, Throwable cause) {
        super("VALIDATION_FAILED", message, cause);
    }
}
