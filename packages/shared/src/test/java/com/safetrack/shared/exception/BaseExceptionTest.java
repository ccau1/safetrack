package com.safetrack.shared.exception;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class BaseExceptionTest {

    @Test
    void constructor_withCodeAndMessage_shouldSetFields() {
        BaseException ex = new BaseException("NOT_FOUND", "User not found");

        assertEquals("NOT_FOUND", ex.getCode());
        assertEquals("User not found", ex.getMessage());
        assertEquals("User not found", ex.getReason());
    }

    @Test
    void constructor_withCodeMessageAndReason_shouldSetFields() {
        BaseException ex = new BaseException("NOT_FOUND", "User not found", "No user with id 123");

        assertEquals("NOT_FOUND", ex.getCode());
        assertEquals("User not found", ex.getMessage());
        assertEquals("No user with id 123", ex.getReason());
    }

    @Test
    void constructor_withCause_shouldUseCauseMessageAsReason() {
        Throwable cause = new RuntimeException("Database timeout");
        BaseException ex = new BaseException("INTERNAL_ERROR", "Operation failed", cause);

        assertEquals("INTERNAL_ERROR", ex.getCode());
        assertEquals("Database timeout", ex.getReason());
        assertSame(cause, ex.getCause());
    }

    @Test
    void constructor_withAllArgs_shouldSetFields() {
        Throwable cause = new RuntimeException("DB error");
        BaseException ex = new BaseException("CONFLICT", "Duplicate", "Email already exists", cause);

        assertEquals("CONFLICT", ex.getCode());
        assertEquals("Duplicate", ex.getMessage());
        assertEquals("Email already exists", ex.getReason());
        assertSame(cause, ex.getCause());
    }

    @Test
    void constructor_withNullCause_shouldUseMessageAsReason() {
        BaseException ex = new BaseException("INTERNAL_ERROR", "Something failed", (Throwable) null);

        assertEquals("Something failed", ex.getReason());
    }
}
