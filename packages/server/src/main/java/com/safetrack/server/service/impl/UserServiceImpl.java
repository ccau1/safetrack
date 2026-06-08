package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.ContactPoint;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.ContactPointRepository;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.RoleRepository;
import com.safetrack.server.domain.repository.UserRepository;
import com.safetrack.server.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizationRepository organizationRepository;
    private final MemberRepository memberRepository;
    private final ContactPointRepository contactPointRepository;

    @Override
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public Optional<User> findById(UUID id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<User> findWithRolesAndPermissionsByEmail(String email) {
        return userRepository.findWithRolesAndPermissionsByEmail(email);
    }

    @Override
    public Optional<User> findWithRolesAndPermissionsById(UUID id) {
        return userRepository.findWithRolesAndPermissionsById(id);
    }

    @Override
    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    @Override
    @Transactional
    public User save(User user) {
        return userRepository.save(user);
    }

    @Override
    @Transactional
    public Optional<User> findOrCreateSsoUser(String email, String firstName, String lastName,
                                              String ssoProvider, String ssoSubject) {
        return userRepository.findBySsoProviderAndSsoSubject(ssoProvider, ssoSubject)
                .or(() -> userRepository.findByEmail(email).map(existing -> {
                    // Link SSO to existing local account
                    existing.setSsoProvider(ssoProvider);
                    existing.setSsoSubject(ssoSubject);
                    return userRepository.save(existing);
                }))
                .or(() -> {
                    Role defaultRole = roleRepository.findByName(Role.RoleName.USER)
                            .orElseThrow(() -> new IllegalStateException("Default role USER not found"));

                    User newUser = User.builder()
                            .email(email)
                            .firstName(firstName)
                            .lastName(lastName)
                            .ssoProvider(ssoProvider)
                            .ssoSubject(ssoSubject)
                            .isActive(true)
                            .roles(Set.of(defaultRole))
                            .build();

                    User savedUser = userRepository.save(newUser);

                    ContactPoint loginEmail = ContactPoint.builder()
                            .user(savedUser)
                            .type(ContactPoint.ContactPointType.EMAIL)
                            .value(savedUser.getEmail().toLowerCase().trim())
                            .label("Login")
                            .category(ContactPoint.ContactPointCategory.SELF)
                            .isPrimary(true)
                            .verifiedAt(java.time.Instant.now())
                            .build();
                    contactPointRepository.save(loginEmail);
                    savedUser.setEmailVerifiedAt(java.time.Instant.now());
                    userRepository.save(savedUser);

                    // Create default organization for SSO user
                    String orgName = firstName + "'s Organization";
                    String slug = generateSlug(orgName);

                    Organization org = Organization.builder()
                            .name(orgName)
                            .slug(slug)
                            .build();

                    Organization savedOrg = organizationRepository.save(org);

                    Member member = Member.builder()
                            .organization(savedOrg)
                            .user(savedUser)
                            .orgRole(Member.OrgRole.ORG_ADMIN)
                            .build();

                    memberRepository.save(member);

                    return Optional.of(savedUser);
                });
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
