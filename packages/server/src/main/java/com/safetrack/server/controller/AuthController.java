package com.safetrack.server.controller;

import com.safetrack.server.controller.dto.request.ChangePasswordRequest;
import com.safetrack.server.controller.dto.request.LoginRequest;
import com.safetrack.server.controller.dto.request.RegisterRequest;
import com.safetrack.server.controller.dto.response.AuthResponse;
import com.safetrack.server.controller.dto.response.UserResponse;
import com.safetrack.server.domain.entity.Member;
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
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final MemberRepository memberRepository;
    private final JwtService jwtService;
    private final UserMapper userMapper;
    private final PermissionEvaluator permissionEvaluator;
    private final RefreshTokenService refreshTokenService;
    private final CookieUtil cookieUtil;

    @Value("${app.jwt.expiration-ms:900000}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                  HttpServletResponse response) {
        User user = authService.register(request);
        Member member = findMemberForUser(user);
        UUID orgId = member != null ? member.getOrganization().getId() : null;

        List<Member> members = memberRepository.findByUserId(user.getId());
        var actions = permissionEvaluator.computeAllowedActions(user, orgId).stream().toList();

        String accessToken = jwtService.generateToken(user, orgId, actions);
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());

        setAuthCookies(response, accessToken, refreshToken);

        return ResponseEntity.ok(userMapper.toAuthResponse(user, members, actions));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                               HttpServletResponse response) {
        User user = authService.login(request);
        List<Member> members = memberRepository.findByUserId(user.getId());
        Member member = members.stream().findFirst().orElse(null);
        UUID orgId = member != null ? member.getOrganization().getId() : null;

        var actions = permissionEvaluator.computeAllowedActions(user, orgId).stream().toList();

        String accessToken = jwtService.generateToken(user, orgId, actions);
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());

        setAuthCookies(response, accessToken, refreshToken);

        return ResponseEntity.ok(userMapper.toAuthResponse(user, members, actions));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = cookieUtil.extractRefreshToken(request);
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).build();
        }

        User user = refreshTokenService.validateRefreshToken(refreshToken);
        Member member = findMemberForUser(user);
        UUID orgId = member != null ? member.getOrganization().getId() : null;

        var actions = permissionEvaluator.computeAllowedActions(user, orgId).stream().toList();
        String newAccessToken = jwtService.generateToken(user, orgId, actions);
        cookieUtil.setAccessTokenCookie(response, newAccessToken, (int) (jwtExpirationMs / 1000));

        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        String refreshToken = cookieUtil.extractRefreshToken(request);
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }
        cookieUtil.clearAuthCookies(response);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        authService.changePassword(user.getId(), request);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me/full")
    public ResponseEntity<AuthResponse> getCurrentUserFull(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        List<Member> members = memberRepository.findByUserId(user.getId());
        Member member = members.stream().findFirst().orElse(null);
        UUID orgId = member != null ? member.getOrganization().getId() : null;
        var actions = permissionEvaluator.computeAllowedActions(user, orgId).stream().toList();
        return ResponseEntity.ok(userMapper.toAuthResponse(user, members, actions));
    }

    private Member findMemberForUser(User user) {
        return memberRepository.findByUserId(user.getId())
                .stream()
                .findFirst()
                .orElse(null);
    }
    
    private void setAuthCookies(HttpServletResponse response, String accessToken, String refreshToken) {
        cookieUtil.setAccessTokenCookie(response, accessToken, (int) (jwtExpirationMs / 1000));
        cookieUtil.setRefreshTokenCookie(response, refreshToken, (int) (refreshExpirationMs / 1000));
    }
}
