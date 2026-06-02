package com.safetrack.shared.exception;

public class NotFoundException extends BaseException {

    public NotFoundException(String resource, Object identifier) {
        super("NOT_FOUND", resource + " not found", "No " + resource.toLowerCase() + " found with identifier: " + identifier);
    }

    public NotFoundException(String resource, Object identifier, Throwable cause) {
        super("NOT_FOUND", resource + " not found", "No " + resource.toLowerCase() + " found with identifier: " + identifier, cause);
    }
}
