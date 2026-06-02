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
