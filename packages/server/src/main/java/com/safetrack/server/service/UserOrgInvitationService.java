package com.safetrack.server.service;

import com.safetrack.server.controller.dto.request.CreateInvitationRequest;
import com.safetrack.server.controller.dto.response.BatchInvitationResponse;
import com.safetrack.server.controller.dto.response.InvitationValidationResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.User;
import com.safetrack.server.domain.entity.UserOrgInvitation;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface UserOrgInvitationService {

    UserOrgInvitation createInvitation(UUID organizationId, CreateInvitationRequest request, User invitedBy);

    BatchInvitationResponse createBatchInvitations(UUID organizationId, MultipartFile csv, User invitedBy);

    InvitationValidationResponse validateToken(String token);

    Member acceptInvitation(String token, User acceptingUser);

    User acceptInvitationForNewUser(String token, String password, String firstName, String lastName);

    UserOrgInvitation resendInvitation(UUID invitationId, User actor);

    void cancelInvitation(UUID invitationId, User actor);

    List<UserOrgInvitation> findPendingByOrganizationId(UUID organizationId);
}
