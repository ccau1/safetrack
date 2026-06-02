package com.safetrack.server.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class CookieUtil {

    @Value("${app.cookie.secure:false}")
    private boolean secure;

    @Value("${app.cookie.same-site:Lax}")
    private String sameSite;

    private static final String ACCESS_TOKEN_NAME = "access_token";
    private static final String REFRESH_TOKEN_NAME = "refresh_token";

    public void setAccessTokenCookie(HttpServletResponse response, String token, int maxAgeSeconds) {
        setCookie(response, ACCESS_TOKEN_NAME, token, maxAgeSeconds, "/");
    }

    public void setRefreshTokenCookie(HttpServletResponse response, String token, int maxAgeSeconds) {
        setCookie(response, REFRESH_TOKEN_NAME, token, maxAgeSeconds, "/api/auth/refresh");
    }

    public void clearAuthCookies(HttpServletResponse response) {
        clearCookie(response, ACCESS_TOKEN_NAME, "/");
        clearCookie(response, REFRESH_TOKEN_NAME, "/api/auth/refresh");
    }

    public String extractAccessToken(HttpServletRequest request) {
        return extractCookieValue(request, ACCESS_TOKEN_NAME);
    }

    public String extractRefreshToken(HttpServletRequest request) {
        return extractCookieValue(request, REFRESH_TOKEN_NAME);
    }

    private void setCookie(HttpServletResponse response, String name, String value, int maxAge, String path) {
        // Use Set-Cookie header directly for SameSite support
        StringBuilder cookie = new StringBuilder();
        cookie.append(name).append("=").append(value).append("; ");
        cookie.append("Max-Age=").append(maxAge).append("; ");
        cookie.append("Path=").append(path).append("; ");
        cookie.append("HttpOnly; ");
        if (secure) {
            cookie.append("Secure; ");
        }
        cookie.append("SameSite=").append(sameSite);
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private void clearCookie(HttpServletResponse response, String name, String path) {
        StringBuilder cookie = new StringBuilder();
        cookie.append(name).append("=; ");
        cookie.append("Max-Age=0; ");
        cookie.append("Path=").append(path).append("; ");
        cookie.append("HttpOnly; ");
        if (secure) {
            cookie.append("Secure; ");
        }
        cookie.append("SameSite=").append(sameSite);
        response.addHeader("Set-Cookie", cookie.toString());
    }

    private String extractCookieValue(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (cookie.getName().equals(name)) {
                return cookie.getValue();
            }
        }
        return null;
    }
}
