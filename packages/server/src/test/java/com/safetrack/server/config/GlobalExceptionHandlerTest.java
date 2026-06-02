package com.safetrack.server.config;

import com.safetrack.shared.dto.ApiError;
import com.safetrack.shared.exception.BaseException;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
        request = mock(HttpServletRequest.class);
        when(request.getRequestURI()).thenReturn("/api/test");
    }

    @Test
    void handleBaseException_shouldReturnResolvedStatus() {
        BaseException ex = new BaseException("NOT_FOUND", "User not found", "No user with id 123");
        ResponseEntity<ApiError> response = handler.handleBaseException(ex, request);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("NOT_FOUND", response.getBody().code());
        assertEquals("User not found", response.getBody().message());
        assertEquals("No user with id 123", response.getBody().reason());
        assertEquals("/api/test", response.getBody().path());
    }

    @Test
    void handleBaseException_shouldReturnInternalErrorForUnknownCode() {
        BaseException ex = new BaseException("UNKNOWN_CODE", "Something happened");
        ResponseEntity<ApiError> response = handler.handleBaseException(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    void handleValidation_shouldReturnBadRequest() {
        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "obj");
        bindingResult.addError(new FieldError("obj", "email", "must not be blank"));
        bindingResult.addError(new FieldError("obj", "password", "must be at least 8 characters"));
        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);

        ResponseEntity<ApiError> response = handler.handleValidation(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("VALIDATION_FAILED", response.getBody().code());
        assertTrue(response.getBody().reason().contains("email: must not be blank"));
        assertTrue(response.getBody().reason().contains("password: must be at least 8 characters"));
    }

    @Test
    void handleIllegalArgument_shouldReturnBadRequest() {
        IllegalArgumentException ex = new IllegalArgumentException("Invalid parameter");
        ResponseEntity<ApiError> response = handler.handleIllegalArgument(ex, request);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("BAD_REQUEST", response.getBody().code());
        assertEquals("Invalid parameter", response.getBody().message());
    }

    @Test
    void handleBadCredentials_shouldReturnUnauthorized() {
        BadCredentialsException ex = new BadCredentialsException("Invalid password");
        ResponseEntity<ApiError> response = handler.handleBadCredentials(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("AUTH_INVALID_CREDENTIALS", response.getBody().code());
    }

    @Test
    void handleAuthentication_shouldReturnUnauthorized() {
        org.springframework.security.core.AuthenticationException ex =
                new org.springframework.security.core.AuthenticationException("Token expired") {};
        ResponseEntity<ApiError> response = handler.handleAuthentication(ex, request);

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals("AUTH_UNAUTHORIZED", response.getBody().code());
    }

    @Test
    void handleAccessDenied_shouldReturnForbidden() {
        AccessDeniedException ex = new AccessDeniedException("Access denied");
        ResponseEntity<ApiError> response = handler.handleAccessDenied(ex, request);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("AUTH_ACCESS_DENIED", response.getBody().code());
    }

    @Test
    void handleGeneric_shouldReturnInternalServerError() {
        Exception ex = new RuntimeException("Unexpected error");
        ResponseEntity<ApiError> response = handler.handleGeneric(ex, request);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("INTERNAL_ERROR", response.getBody().code());
        assertEquals("Unexpected error", response.getBody().reason());
    }
}
