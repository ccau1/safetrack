package com.safetrack.shared.exception;

public class AuthorizationException extends BaseException {

    public AuthorizationException(String message) {
        super("AUTH_ACCESS_DENIED", message);
    }

    public AuthorizationException(String message, Throwable cause) {
        super("AUTH_ACCESS_DENIED", message, cause);
    }
}
