package com.safetrack.server.service.impl;

import com.safetrack.server.controller.dto.request.LoginRequest;
import com.safetrack.server.controller.dto.request.RegisterRequest;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserOrgInvitation;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.RoleRepository;
import com.safetrack.server.domain.repository.UserOrgInvitationRepository;
import com.safetrack.server.domain.repository.UserRepository;
import com.safetrack.server.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final MemberRepository memberRepository;
    private final UserOrgInvitationRepository invitationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered");
        }

        Role defaultRole = roleRepository.findByName(Role.RoleName.USER)
                .orElseThrow(() -> new IllegalStateException("Default role not found"));

        String firstName = request.firstName();
        String lastName = request.lastName();

        UserOrgInvitation invitation = null;
        if (request.inviteToken() != null && !request.inviteToken().isBlank()) {
            invitation = invitationRepository.findByToken(request.inviteToken())
                    .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

            if (invitation.getStatus() != UserOrgInvitation.Status.PENDING) {
                throw new IllegalStateException("Invitation is no longer valid");
            }

            if (invitation.isExpired()) {
                invitation.setStatus(UserOrgInvitation.Status.EXPIRED);
                invitationRepository.save(invitation);
                throw new IllegalStateException("Invitation has expired");
            }

            if (!invitation.getEmail().equalsIgnoreCase(request.email())) {
                throw new IllegalArgumentException("This invitation is for a different email address");
            }

            if (firstName == null || firstName.isBlank()) {
                firstName = invitation.getInvitedFirstName();
            }
            if (lastName == null || lastName.isBlank()) {
                lastName = invitation.getInvitedLastName();
            }
        }

        if (firstName == null || firstName.isBlank()) {
            firstName = "User";
        }
        if (lastName == null || lastName.isBlank()) {
            lastName = "";
        }

        User user = User.builder()
                .email(request.email())
                .firstName(firstName)
                .lastName(lastName)
                .passwordHash(passwordEncoder.encode(request.password()))
                .isActive(true)
                .roles(Set.of(defaultRole))
                .build();

        User savedUser = userRepository.save(user);

        if (invitation != null) {
            // When registering via invite, do NOT create a default organization.
            // The user will explicitly accept the invite after registration.
            return savedUser;
        }

        // Create default organization for the user
        String orgName = request.organizationName() != null
                ? request.organizationName()
                : savedUser.getFirstName() + "'s Organization";
        String slug = generateSlug(orgName);

        Organization org = Organization.builder()
                .name(orgName)
                .slug(slug)
                .build();

        Organization savedOrg = organizationRepository.save(org);

        // Create member record linking user to their organization as admin
        Member member = Member.builder()
                .organization(savedOrg)
                .user(savedUser)
                .orgRole(Member.OrgRole.ORG_ADMIN)
                .build();

        memberRepository.save(member);

        return savedUser;
    }

    @Override
    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.getPasswordHash() == null) {
            throw new BadCredentialsException("Please use SSO login for this account");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new BadCredentialsException("Account is deactivated");
        }

        return user;
    }

    private String generateSlug(String orgName) {
        String base = orgName.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-");
        if (base.length() > 60) {
            base = base.substring(0, 60);
        }
        String slug = base;
        int suffix = 1;
        while (organizationRepository.existsBySlug(slug)) {
            slug = base + "-" + suffix++;
        }
        return slug;
    }
}
