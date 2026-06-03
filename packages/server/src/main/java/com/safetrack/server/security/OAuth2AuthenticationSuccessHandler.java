package com.safetrack.server.security;

import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.security.permission.PermissionEvaluator;
import com.safetrack.server.service.RefreshTokenService;
import com.safetrack.server.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtService jwtService;
    private final UserService userService;
    private final MemberRepository memberRepository;
    private final PermissionEvaluator permissionEvaluator;
    private final RefreshTokenService refreshTokenService;
    private final CookieUtil cookieUtil;

    @Value("${app.jwt.expiration-ms:900000}")
    private long jwtExpirationMs;

    @Value("${app.jwt.refresh-expiration-ms:604800000}")
    private long refreshExpirationMs;

    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");

        User user = userService.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("SSO user not found after provisioning"));

        Member member = memberRepository.findByUserId(user.getId())
                .stream()
                .findFirst()
                .orElse(null);
        UUID orgId = member != null ? member.getOrganization().getId() : null;

        var actions = permissionEvaluator.computeAllowedActions(user, orgId).stream().toList();
        String accessToken = jwtService.generateToken(user, orgId, actions);
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());

        cookieUtil.setAccessTokenCookie(response, accessToken, (int) (jwtExpirationMs / 1000));
        cookieUtil.setRefreshTokenCookie(response, refreshToken, (int) (refreshExpirationMs / 1000));

        // Check if there's a post-auth redirect cookie (e.g., from invite acceptance page)
        String postAuthRedirect = cookieUtil.extractPostAuthRedirect(request);
        String targetUrl = redirectUri;
        if (postAuthRedirect != null && !postAuthRedirect.isBlank()) {
            targetUrl = postAuthRedirect;
            cookieUtil.clearPostAuthRedirectCookie(response);
        }

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
