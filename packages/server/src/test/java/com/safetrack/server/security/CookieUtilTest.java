package com.safetrack.server.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CookieUtilTest {

    @InjectMocks
    private CookieUtil cookieUtil;

    @Mock
    private HttpServletResponse response;

    @Mock
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(cookieUtil, "secure", false);
        ReflectionTestUtils.setField(cookieUtil, "sameSite", "Lax");
    }

    @Test
    void setAccessTokenCookie_shouldAddSetCookieHeader() {
        cookieUtil.setAccessTokenCookie(response, "mytoken", 900);

        ArgumentCaptor<String> headerNameCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> headerValueCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).addHeader(headerNameCaptor.capture(), headerValueCaptor.capture());

        assertEquals("Set-Cookie", headerNameCaptor.getValue());
        String cookie = headerValueCaptor.getValue();
        assertTrue(cookie.contains("access_token=mytoken"));
        assertTrue(cookie.contains("Max-Age=900"));
        assertTrue(cookie.contains("Path=/"));
        assertTrue(cookie.contains("HttpOnly"));
        assertTrue(cookie.contains("SameSite=Lax"));
        assertFalse(cookie.contains("Secure"));
    }

    @Test
    void setRefreshTokenCookie_shouldAddSetCookieHeaderWithRestrictedPath() {
        cookieUtil.setRefreshTokenCookie(response, "myrefreshtoken", 604800);

        ArgumentCaptor<String> headerValueCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).addHeader(anyString(), headerValueCaptor.capture());

        String cookie = headerValueCaptor.getValue();
        assertTrue(cookie.contains("refresh_token=myrefreshtoken"));
        assertTrue(cookie.contains("Path=/api/auth/refresh"));
    }

    @Test
    void setAccessTokenCookie_shouldAddSecureFlag_whenSecureEnabled() {
        ReflectionTestUtils.setField(cookieUtil, "secure", true);
        cookieUtil.setAccessTokenCookie(response, "mytoken", 900);

        ArgumentCaptor<String> headerValueCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).addHeader(anyString(), headerValueCaptor.capture());

        assertTrue(headerValueCaptor.getValue().contains("Secure"));
    }

    @Test
    void clearAuthCookies_shouldAddClearHeaders() {
        cookieUtil.clearAuthCookies(response);

        verify(response, times(2)).addHeader(anyString(), anyString());
    }

    @Test
    void extractAccessToken_shouldReturnToken_whenCookieExists() {
        Cookie cookie = new Cookie("access_token", "mytoken");
        when(request.getCookies()).thenReturn(new Cookie[]{cookie});

        assertEquals("mytoken", cookieUtil.extractAccessToken(request));
    }

    @Test
    void extractAccessToken_shouldReturnNull_whenNoCookies() {
        when(request.getCookies()).thenReturn(null);
        assertNull(cookieUtil.extractAccessToken(request));
    }

    @Test
    void extractAccessToken_shouldReturnNull_whenCookieNotFound() {
        when(request.getCookies()).thenReturn(new Cookie[]{new Cookie("other", "value")});
        assertNull(cookieUtil.extractAccessToken(request));
    }

    @Test
    void extractRefreshToken_shouldReturnToken_whenCookieExists() {
        Cookie cookie = new Cookie("refresh_token", "myrefresh");
        when(request.getCookies()).thenReturn(new Cookie[]{cookie});

        assertEquals("myrefresh", cookieUtil.extractRefreshToken(request));
    }
}
