package com.safetrack.shared.exception;

public class AuthenticationException extends BaseException {

    public AuthenticationException(String message) {
        super("AUTH_INVALID_CREDENTIALS", message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super("AUTH_INVALID_CREDENTIALS", message, cause);
    }
}
