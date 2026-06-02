package com.safetrack.shared.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class ApiErrorTest {

    @Test
    void builder_shouldBuildWithDefaults() {
        ApiError error = ApiError.builder().build();

        assertEquals("INTERNAL_ERROR", error.code());
        assertEquals("An unexpected error occurred", error.message());
        assertEquals("", error.reason());
        assertEquals("", error.path());
        assertEquals(500, error.status());
        assertNotNull(error.timestamp());
    }

    @Test
    void builder_shouldAllowOverridingDefaults() {
        ApiError error = ApiError.builder()
                .code("VALIDATION_FAILED")
                .message("Validation error")
                .reason("Field X is required")
                .path("/api/users")
                .status(400)
                .build();

        assertEquals("VALIDATION_FAILED", error.code());
        assertEquals("Validation error", error.message());
        assertEquals("Field X is required", error.reason());
        assertEquals("/api/users", error.path());
        assertEquals(400, error.status());
    }

    @Test
    void convenienceConstructor_shouldSetTimestamp() {
        ApiError error = new ApiError("NOT_FOUND", "Not found", "User 123 missing", "/api/users/123", 404);

        assertEquals("NOT_FOUND", error.code());
        assertEquals(404, error.status());
        assertNotNull(error.timestamp());
    }
}
