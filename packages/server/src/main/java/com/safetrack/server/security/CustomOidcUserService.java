package com.safetrack.server.security;

import com.safetrack.server.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomOidcUserService extends OidcUserService {

    private final UserService userService;

    @Override
    public OidcUser loadUser(OidcUserRequest userRequest) throws OAuth2AuthenticationException {
        OidcUser oidcUser = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId();
        String subject = oidcUser.getSubject();
        String email = oidcUser.getEmail();
        String firstName = oidcUser.getGivenName() != null ? oidcUser.getGivenName() : "";
        String lastName = oidcUser.getFamilyName() != null ? oidcUser.getFamilyName() : "";

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Email not provided by identity provider");
        }

        userService.findOrCreateSsoUser(email, firstName, lastName, provider, subject)
                .orElseThrow(() -> new OAuth2AuthenticationException("Failed to provision user"));

        return oidcUser;
    }
}
