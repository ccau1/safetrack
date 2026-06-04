package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.UserRepository;
import com.safetrack.server.service.OrganizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrganizationServiceImpl implements OrganizationService {

    private final OrganizationRepository organizationRepository;
    private final MemberRepository memberRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Organization createOrganization(String name, UUID creatorUserId) {
        User user = userRepository.findById(creatorUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String slug = generateSlug(name);

        Organization org = Organization.builder()
                .name(name)
                .slug(slug)
                .owner(user)
                .build();

        Organization savedOrg = organizationRepository.save(org);

        Member member = Member.builder()
                .organization(savedOrg)
                .user(user)
                .orgRole(Member.OrgRole.ORG_ADMIN)
                .build();

        memberRepository.save(member);

        return savedOrg;
    }

    @Override
    public Optional<Organization> findById(UUID id) {
        return organizationRepository.findById(id);
    }

    @Override
    public Optional<Organization> findBySlug(String slug) {
        return organizationRepository.findBySlug(slug);
    }

    @Override
    public List<Organization> findByUserId(UUID userId) {
        return memberRepository.findByUserId(userId).stream()
                .map(Member::getOrganization)
                .toList();
    }

    @Override
    public Optional<Organization> findByOwnerId(UUID userId) {
        return organizationRepository.findByOwnerId(userId);
    }

    @Override
    @Transactional
    public void transferOwnership(UUID orgId, UUID newOwnerId, UUID currentOwnerId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        if (org.getOwner() == null || !org.getOwner().getId().equals(currentOwnerId)) {
            throw new IllegalStateException("Only the current owner can transfer ownership");
        }

        if (newOwnerId.equals(currentOwnerId)) {
            throw new IllegalArgumentException("Cannot transfer ownership to yourself");
        }

        User newOwner = userRepository.findById(newOwnerId)
                .orElseThrow(() -> new IllegalArgumentException("New owner not found"));

        // Ensure new owner is a member of the org with ORG_ADMIN role
        Member member = memberRepository.findByOrganizationIdAndUserId(orgId, newOwnerId)
                .orElseGet(() -> {
                    Member m = Member.builder()
                            .organization(org)
                            .user(newOwner)
                            .orgRole(Member.OrgRole.ORG_ADMIN)
                            .build();
                    return memberRepository.save(m);
                });

        if (member.getOrgRole() != Member.OrgRole.ORG_ADMIN) {
            member.setOrgRole(Member.OrgRole.ORG_ADMIN);
            memberRepository.save(member);
        }

        org.setOwner(newOwner);
        organizationRepository.save(org);
    }

    @Override
    @Transactional
    public Organization updateOrganization(UUID orgId, String newName, UUID actorUserId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        if (org.getOwner() == null || !org.getOwner().getId().equals(actorUserId)) {
            throw new IllegalStateException("Only the owner can update this organization");
        }

        if (newName != null && !newName.isBlank()) {
            org.setName(newName.trim());
        }

        return organizationRepository.save(org);
    }

    @Override
    @Transactional
    public void deleteOrganization(UUID orgId, UUID actorUserId) {
        Organization org = organizationRepository.findById(orgId)
                .orElseThrow(() -> new IllegalArgumentException("Organization not found"));

        if (org.getOwner() == null || !org.getOwner().getId().equals(actorUserId)) {
            throw new IllegalStateException("Only the owner can delete this organization");
        }

        organizationRepository.delete(org);
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
