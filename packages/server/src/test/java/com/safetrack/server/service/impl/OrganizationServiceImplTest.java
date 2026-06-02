package com.safetrack.server.service.impl;

import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Organization;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.repository.MemberRepository;
import com.safetrack.server.domain.repository.OrganizationRepository;
import com.safetrack.server.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceImplTest {

    @Mock
    private OrganizationRepository organizationRepository;
    @Mock
    private MemberRepository memberRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private OrganizationServiceImpl organizationService;

    @Test
    void createOrganization_shouldCreateOrgAndMember() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).email("test@example.com").build();
        Organization savedOrg = Organization.builder().id(UUID.randomUUID()).name("My Org").slug("my-org").build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(organizationRepository.save(any(Organization.class))).thenReturn(savedOrg);
        when(organizationRepository.existsBySlug("my-org")).thenReturn(false);
        when(memberRepository.save(any(Member.class))).thenAnswer(i -> i.getArgument(0));

        Organization result = organizationService.createOrganization("My Org", userId);

        assertEquals("My Org", result.getName());
        verify(organizationRepository).save(any(Organization.class));
        verify(memberRepository).save(any(Member.class));
    }

    @Test
    void createOrganization_shouldThrow_whenUserNotFound() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> organizationService.createOrganization("My Org", userId));
    }

    @Test
    void findById_shouldReturnOrganization() {
        UUID orgId = UUID.randomUUID();
        Organization org = Organization.builder().id(orgId).name("My Org").build();
        when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));

        Optional<Organization> result = organizationService.findById(orgId);
        assertTrue(result.isPresent());
    }

    @Test
    void findBySlug_shouldReturnOrganization() {
        Organization org = Organization.builder().id(UUID.randomUUID()).slug("my-org").build();
        when(organizationRepository.findBySlug("my-org")).thenReturn(Optional.of(org));

        Optional<Organization> result = organizationService.findBySlug("my-org");
        assertTrue(result.isPresent());
    }

    @Test
    void findByUserId_shouldReturnOrganizations() {
        UUID userId = UUID.randomUUID();
        Organization org1 = Organization.builder().id(UUID.randomUUID()).name("Org 1").build();
        Organization org2 = Organization.builder().id(UUID.randomUUID()).name("Org 2").build();
        Member m1 = Member.builder().organization(org1).build();
        Member m2 = Member.builder().organization(org2).build();

        when(memberRepository.findByUserId(userId)).thenReturn(List.of(m1, m2));

        List<Organization> result = organizationService.findByUserId(userId);
        assertEquals(2, result.size());
    }

    @Test
    void generateSlug_shouldAppendSuffix_whenSlugExists() {
        UUID userId = UUID.randomUUID();
        User user = User.builder().id(userId).build();
        Organization savedOrg = Organization.builder().id(UUID.randomUUID()).name("My Org").slug("my-org-1").build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(organizationRepository.existsBySlug("my-org")).thenReturn(true);
        when(organizationRepository.existsBySlug("my-org-1")).thenReturn(false);
        when(organizationRepository.save(any(Organization.class))).thenReturn(savedOrg);
        when(memberRepository.save(any(Member.class))).thenAnswer(i -> i.getArgument(0));

        Organization result = organizationService.createOrganization("My Org", userId);
        assertEquals("my-org-1", result.getSlug());
    }
}
