package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.LoginRequest;
import com.safetrack.server.controller.dto.request.RegisterRequest;
import com.safetrack.server.controller.dto.response.AuthResponse;
import com.safetrack.server.controller.dto.response.UserResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.mapper.UserMapper;
import com.safetrack.server.security.CookieUtil;
import com.safetrack.server.security.JwtService;
import com.safetrack.server.security.permission.PermissionEvaluator;
import com.safetrack.server.service.AuthService;
import com.safetrack.server.service.RefreshTokenService;
import com.safetrack.server.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AuthControllerTest {

    @Mock
    private AuthService authService;
    @Mock
    private UserService userService;
    @Mock
    private MemberRepository memberRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PermissionEvaluator permissionEvaluator;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private CookieUtil cookieUtil;
    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;

    @InjectMocks
    private AuthController authController;

    @Test
    void register_shouldReturnAuthResponse() {
        RegisterRequest req = new RegisterRequest("john@example.com", "password", "John", "Doe", null, null);
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("john@example.com")
                .firstName("John")
                .lastName("Doe")
                .roles(Set.of(Role.builder().name(Role.RoleName.USER).build()))
                .build();
        Organization org = Organization.builder().id(UUID.randomUUID()).name("My Org").slug("my-org").build();
        Member member = Member.builder().id(UUID.randomUUID()).organization(org).build();
        AuthResponse authResponse = new AuthResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                List.of("USER"), List.of(), null, List.of());

        when(authService.register(req)).thenReturn(user);
        when(memberRepository.findByUserId(user.getId())).thenReturn(List.of(member));
        when(jwtService.generateToken(any(User.class), any(), any())).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(any())).thenReturn("refresh-token");
        when(permissionEvaluator.computeAllowedActions(any())).thenReturn(Set.of("read"));
        when(userMapper.toAuthResponse(any(), any(), any())).thenReturn(authResponse);

        ResponseEntity<AuthResponse> result = authController.register(req, response);

        assertEquals(200, result.getStatusCode().value());
        assertEquals("john@example.com", result.getBody().email());
        verify(cookieUtil).setAccessTokenCookie(eq(response), eq("access-token"), anyInt());
        verify(cookieUtil).setRefreshTokenCookie(eq(response), eq("refresh-token"), anyInt());
    }

    @Test
    void login_shouldReturnAuthResponse() {
        LoginRequest req = new LoginRequest("john@example.com", "password");
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("john@example.com")
                .firstName("John")
                .lastName("Doe")
                .roles(Set.of())
                .build();
        AuthResponse authResponse = new AuthResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(),
                List.of(), List.of(), null, List.of());

        when(authService.login(req)).thenReturn(user);
        when(memberRepository.findByUserId(user.getId())).thenReturn(List.of());
        when(jwtService.generateToken(any(User.class), any(), any())).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(any())).thenReturn("refresh-token");
        when(permissionEvaluator.computeAllowedActions(any())).thenReturn(Set.of());
        when(userMapper.toAuthResponse(any(), any(), any())).thenReturn(authResponse);

        ResponseEntity<AuthResponse> result = authController.login(req, response);

        assertEquals(200, result.getStatusCode().value());
        assertEquals("john@example.com", result.getBody().email());
    }

    @Test
    void refresh_shouldReturnOk_whenValidRefreshToken() {
        User user = User.builder().id(UUID.randomUUID()).build();

        when(cookieUtil.extractRefreshToken(request)).thenReturn("valid-refresh");
        when(refreshTokenService.validateRefreshToken("valid-refresh")).thenReturn(user);
        when(memberRepository.findByUserId(user.getId())).thenReturn(List.of());
        when(jwtService.generateToken(any(User.class), any(), any())).thenReturn("new-access");

        ResponseEntity<Void> result = authController.refresh(request, response);

        assertEquals(200, result.getStatusCode().value());
        verify(cookieUtil).setAccessTokenCookie(eq(response), eq("new-access"), anyInt());
    }

    @Test
    void refresh_shouldReturnUnauthorized_whenNoRefreshToken() {
        when(cookieUtil.extractRefreshToken(request)).thenReturn(null);

        ResponseEntity<Void> result = authController.refresh(request, response);

        assertEquals(401, result.getStatusCode().value());
    }

    @Test
    void logout_shouldReturnOk() {
        when(cookieUtil.extractRefreshToken(request)).thenReturn("refresh-token");
        doNothing().when(refreshTokenService).revokeRefreshToken("refresh-token");

        ResponseEntity<Void> result = authController.logout(request, response);

        assertEquals(200, result.getStatusCode().value());
        verify(cookieUtil).clearAuthCookies(response);
    }

    @Test
    void getCurrentUser_shouldReturnUserResponse() {
        User user = User.builder()
                .id(UUID.randomUUID())
                .email("test@example.com")
                .firstName("Test")
                .lastName("User")
                .isActive(true)
                .roles(Set.of())
                .build();
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username("test@example.com")
                .password("")
                .roles("USER")
                .build();
        UserResponse userResponse = new UserResponse(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), true, List.of(), null);

        when(userService.findByEmail("test@example.com")).thenReturn(Optional.of(user));
        when(userMapper.toResponse(user)).thenReturn(userResponse);

        ResponseEntity<UserResponse> result = authController.getCurrentUser(userDetails);

        assertEquals(200, result.getStatusCode().value());
        assertEquals("test@example.com", result.getBody().email());
    }
}
