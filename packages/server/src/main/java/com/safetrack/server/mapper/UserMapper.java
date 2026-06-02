package com.safetrack.server.mapper;

import com.safetrack.server.controller.dto.response.AuthResponse;
import com.safetrack.server.controller.dto.response.UserResponse;
import com.safetrack.server.domain.entity.Member;
import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "active", source = "isActive")
    UserResponse toResponse(User user);

    default AuthResponse toAuthResponse(User user, List<Member> members, List<String> actions) {
        List<AuthResponse.OrganizationInfo> orgInfos = members.stream()
                .filter(m -> m.getOrganization() != null)
                .map(m -> new AuthResponse.OrganizationInfo(
                        m.getOrganization().getId(),
                        m.getOrganization().getName(),
                        m.getOrganization().getSlug(),
                        m.getOrgRole().name()
                ))
                .toList();

        AuthResponse.OrganizationInfo primaryOrg = orgInfos.isEmpty() ? null : orgInfos.get(0);

        List<String> roles = mapRoles(user.getRoles());

        return new AuthResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                roles,
                actions,
                primaryOrg,
                orgInfos
        );
    }

    default List<String> mapRoles(Set<Role> roles) {
        if (roles == null) {
            return List.of();
        }
        return roles.stream()
                .map(role -> role.getName().name())
                .collect(Collectors.toList());
    }
}
