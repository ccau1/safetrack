package com.safetrack.server.service.impl;

import com.safetrack.server.controller.dto.request.CreateInvitationRequest;
import com.safetrack.server.controller.dto.response.BatchInvitationResponse;
import com.safetrack.server.controller.dto.response.InvitationValidationResponse;
import com.safetrack.server.domain.entity.*;
import com.safetrack.server.domain.repository.*;
import com.safetrack.server.service.EmailService;
import com.safetrack.server.service.UserOrgInvitationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class UserOrgInvitationServiceImpl implements UserOrgInvitationService {

    private final UserOrgInvitationRepository invitationRepository;
    private final OrganizationRepository organizationRepository;
    private final MemberRepository memberRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final UserContactRepository userContactRepository;
    private final RoleRepository roleRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.invitation.expiry-hours:24}")
    private int expiryHours;

    @Override
    public UserOrgInvitation createInvitation(UUID organizationId, CreateInvitationRequest request, User invitedBy) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        // Check if invited email is already a member
        Optional<User> existingUser = userRepository.findByEmail(request.email());
        if (existingUser.isPresent() && memberRepository.existsByOrganizationIdAndUserId(organizationId, existingUser.get().getId())) {
            throw new IllegalArgumentException("User is already a member of this organization");
        }

        // Check for existing pending invitation
        if (invitationRepository.existsByOrganizationIdAndEmailAndStatus(organizationId, request.email(), UserOrgInvitation.Status.PENDING)) {
            throw new IllegalArgumentException("A pending invitation already exists for this email");
        }

        Team team = null;
        if (request.teamId() != null && !request.teamId().isBlank()) {
            team = teamRepository.findByIdAndDeletedAtIsNull(UUID.fromString(request.teamId()))
                    .orElseThrow(() -> new IllegalArgumentException("Team not found"));
            if (!team.getOrganization().getId().equals(organizationId)) {
                throw new IllegalArgumentException("Team does not belong to this organization");
            }
        }

        UserOrgInvitation.OrgRole role = parseOrgRole(request.orgRole());

        UserOrgInvitation invitation = UserOrgInvitation.builder()
                .token(UUID.randomUUID().toString())
                .email(request.email().toLowerCase().trim())
                .organization(organization)
                .team(team)
                .orgRole(role)
                .invitedBy(invitedBy)
                .expiresAt(Instant.now().plus(expiryHours, ChronoUnit.HOURS))
                .invitedFirstName(request.firstName())
                .invitedLastName(request.lastName())
                .phoneNumber(request.phoneNumber())
                .alternatePhoneNumber(request.alternatePhoneNumber())
                .nextOfKinName(request.nextOfKinName())
                .nextOfKinRelationship(request.nextOfKinRelationship())
                .nextOfKinPhone(request.nextOfKinPhone())
                .nextOfKinEmail(request.nextOfKinEmail())
                .build();

        UserOrgInvitation saved = invitationRepository.save(invitation);
        emailService.sendInvitationEmail(saved.getEmail(), saved.getToken(), organization.getName());
        return saved;
    }

    @Override
    public BatchInvitationResponse createBatchInvitations(UUID organizationId, MultipartFile csv, User invitedBy) {
        Organization organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        List<BatchInvitationResponse.BatchError> errors = new ArrayList<>();
        int createdCount = 0;
        int skippedCount = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(csv.getInputStream(), StandardCharsets.UTF_8));
             CSVParser parser = CSVFormat.DEFAULT.builder()
                     .setHeader()
                     .setIgnoreHeaderCase(true)
                     .setTrim(true)
                     .build()
                     .parse(reader)) {

            int rowNum = 1; // header is row 0
            for (CSVRecord record : parser) {
                rowNum++;
                try {
                    String email = record.get("email");
                    if (email == null || email.isBlank()) {
                        errors.add(new BatchInvitationResponse.BatchError(rowNum, "", "Email is required"));
                        continue;
                    }
                    email = email.toLowerCase().trim();

                    // Check if already a member
                    Optional<User> existingUser = userRepository.findByEmail(email);
                    if (existingUser.isPresent() && memberRepository.existsByOrganizationIdAndUserId(organizationId, existingUser.get().getId())) {
                        skippedCount++;
                        continue;
                    }

                    // Check for existing pending invitation
                    if (invitationRepository.existsByOrganizationIdAndEmailAndStatus(organizationId, email, UserOrgInvitation.Status.PENDING)) {
                        skippedCount++;
                        continue;
                    }

                    String teamName = getCsvValue(record, "teamName");
                    Team team = null;
                    if (teamName != null && !teamName.isBlank()) {
                        team = teamRepository.findByOrganizationIdAndNameAndDeletedAtIsNull(organizationId, teamName)
                                .orElse(null);
                    }

                    UserOrgInvitation.OrgRole role = parseOrgRole(getCsvValue(record, "orgRole"));

                    UserOrgInvitation invitation = UserOrgInvitation.builder()
                            .token(UUID.randomUUID().toString())
                            .email(email)
                            .organization(organization)
                            .team(team)
                            .orgRole(role)
                            .invitedBy(invitedBy)
                            .expiresAt(Instant.now().plus(expiryHours, ChronoUnit.HOURS))
                            .invitedFirstName(getCsvValue(record, "firstName"))
                            .invitedLastName(getCsvValue(record, "lastName"))
                            .phoneNumber(getCsvValue(record, "phoneNumber"))
                            .alternatePhoneNumber(getCsvValue(record, "alternatePhoneNumber"))
                            .nextOfKinName(getCsvValue(record, "nextOfKinName"))
                            .nextOfKinRelationship(getCsvValue(record, "nextOfKinRelationship"))
                            .nextOfKinPhone(getCsvValue(record, "nextOfKinPhone"))
                            .nextOfKinEmail(getCsvValue(record, "nextOfKinEmail"))
                            .build();

                    invitationRepository.save(invitation);
                    emailService.sendInvitationEmail(invitation.getEmail(), invitation.getToken(), organization.getName());
                    createdCount++;
                } catch (Exception e) {
                    String email = getCsvValue(record, "email");
                    errors.add(new BatchInvitationResponse.BatchError(rowNum, email != null ? email : "", e.getMessage()));
                }
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Failed to parse CSV: " + e.getMessage());
        }

        return new BatchInvitationResponse(createdCount, skippedCount, errors);
    }

    @Override
    @Transactional(readOnly = true)
    public InvitationValidationResponse validateToken(String token) {
        UserOrgInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if (invitation.getStatus() != UserOrgInvitation.Status.PENDING) {
            throw new IllegalStateException("Invitation is no longer valid");
        }

        if (invitation.isExpired()) {
            invitation.setStatus(UserOrgInvitation.Status.EXPIRED);
            invitationRepository.save(invitation);
            throw new IllegalStateException("Invitation has expired");
        }

        boolean existingUser = userRepository.existsByEmail(invitation.getEmail());

        return new InvitationValidationResponse(
                invitation.getToken(),
                invitation.getEmail(),
                invitation.getOrganization().getName(),
                invitation.getTeam() != null ? invitation.getTeam().getName() : null,
                invitation.getOrgRole().name(),
                invitation.getExpiresAt(),
                existingUser
        );
    }

    @Override
    public Member acceptInvitation(String token, User acceptingUser) {
        UserOrgInvitation invitation = findAndValidateInvitation(token);
        return createMemberFromInvitation(invitation, acceptingUser);
    }

    @Override
    public User acceptInvitationForNewUser(String token, String password, String firstName, String lastName) {
        UserOrgInvitation invitation = findAndValidateInvitation(token);

        if (userRepository.existsByEmail(invitation.getEmail())) {
            throw new IllegalStateException("An account with this email already exists. Please sign in to accept the invitation.");
        }

        Role defaultRole = roleRepository.findByName(Role.RoleName.USER)
                .orElseThrow(() -> new IllegalStateException("Default role not found"));

        String fn = (firstName != null && !firstName.isBlank()) ? firstName : invitation.getInvitedFirstName();
        String ln = (lastName != null && !lastName.isBlank()) ? lastName : invitation.getInvitedLastName();
        if (fn == null || fn.isBlank()) fn = "User";
        if (ln == null || ln.isBlank()) ln = "";

        User user = User.builder()
                .email(invitation.getEmail())
                .firstName(fn)
                .lastName(ln)
                .passwordHash(passwordEncoder.encode(password))
                .isActive(true)
                .roles(Set.of(defaultRole))
                .build();

        User savedUser = userRepository.save(user);
        createMemberFromInvitation(invitation, savedUser);
        return savedUser;
    }

    private UserOrgInvitation findAndValidateInvitation(String token) {
        UserOrgInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid invitation token"));

        if (invitation.getStatus() != UserOrgInvitation.Status.PENDING) {
            throw new IllegalStateException("Invitation is no longer valid");
        }

        if (invitation.isExpired()) {
            invitation.setStatus(UserOrgInvitation.Status.EXPIRED);
            invitationRepository.save(invitation);
            throw new IllegalStateException("Invitation has expired");
        }

        return invitation;
    }

    private Member createMemberFromInvitation(UserOrgInvitation invitation, User user) {
        // Check if already a member
        Optional<Member> existingMember = memberRepository.findByOrganizationIdAndUserId(
                invitation.getOrganization().getId(), user.getId());
        if (existingMember.isPresent()) {
            throw new IllegalStateException("You are already a member of this organization");
        }

        Member member = Member.builder()
                .organization(invitation.getOrganization())
                .user(user)
                .team(invitation.getTeam())
                .orgRole(Member.OrgRole.valueOf(invitation.getOrgRole().name()))
                .build();

        Member savedMember = memberRepository.save(member);

        // Create UserContact from invitation data if user doesn't have one
        if (user.getContact() == null && hasContactData(invitation)) {
            UserContact contact = UserContact.builder()
                    .user(user)
                    .email(invitation.getEmail())
                    .phoneNumber(invitation.getPhoneNumber())
                    .alternatePhoneNumber(invitation.getAlternatePhoneNumber())
                    .nextOfKinName(invitation.getNextOfKinName())
                    .nextOfKinRelationship(invitation.getNextOfKinRelationship())
                    .nextOfKinPhone(invitation.getNextOfKinPhone())
                    .nextOfKinEmail(invitation.getNextOfKinEmail())
                    .build();
            userContactRepository.save(contact);
            user.setContact(contact);
        }

        invitation.setStatus(UserOrgInvitation.Status.ACCEPTED);
        invitation.setAcceptedAt(Instant.now());
        invitation.setAcceptedBy(user);
        invitationRepository.save(invitation);

        return savedMember;
    }

    @Override
    public UserOrgInvitation resendInvitation(UUID invitationId, User actor) {
        UserOrgInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        validateActorInOrganization(actor, invitation.getOrganization().getId());

        if (invitation.getStatus() != UserOrgInvitation.Status.PENDING && invitation.getStatus() != UserOrgInvitation.Status.EXPIRED) {
            throw new IllegalStateException("Only pending or expired invitations can be resent");
        }

        invitation.setToken(UUID.randomUUID().toString());
        invitation.setStatus(UserOrgInvitation.Status.PENDING);
        invitation.setExpiresAt(Instant.now().plus(expiryHours, ChronoUnit.HOURS));

        UserOrgInvitation saved = invitationRepository.save(invitation);
        emailService.sendInvitationEmail(saved.getEmail(), saved.getToken(), saved.getOrganization().getName());
        return saved;
    }

    @Override
    public void cancelInvitation(UUID invitationId, User actor) {
        UserOrgInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        validateActorInOrganization(actor, invitation.getOrganization().getId());

        invitation.setStatus(UserOrgInvitation.Status.CANCELLED);
        invitationRepository.save(invitation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserOrgInvitation> findPendingByOrganizationId(UUID organizationId) {
        return invitationRepository.findByOrganizationIdAndStatus(organizationId, UserOrgInvitation.Status.PENDING);
    }

    private void validateActorInOrganization(User actor, UUID organizationId) {
        memberRepository.findByOrganizationIdAndUserId(organizationId, actor.getId())
                .orElseThrow(() -> new IllegalArgumentException("Not a member of this organization"));
    }

    private UserOrgInvitation.OrgRole parseOrgRole(String role) {
        if (role == null || role.isBlank()) {
            return UserOrgInvitation.OrgRole.ORG_MEMBER;
        }
        try {
            return UserOrgInvitation.OrgRole.valueOf(role.toUpperCase());
        } catch (IllegalArgumentException e) {
            return UserOrgInvitation.OrgRole.ORG_MEMBER;
        }
    }

    private String getCsvValue(CSVRecord record, String header) {
        if (!record.isMapped(header)) {
            return null;
        }
        String value = record.get(header);
        return value != null && !value.isBlank() ? value : null;
    }

    private boolean hasContactData(UserOrgInvitation invitation) {
        return invitation.getPhoneNumber() != null
                || invitation.getAlternatePhoneNumber() != null
                || invitation.getNextOfKinName() != null
                || invitation.getNextOfKinRelationship() != null
                || invitation.getNextOfKinPhone() != null
                || invitation.getNextOfKinEmail() != null;
    }
}
