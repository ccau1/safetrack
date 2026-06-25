package com.safetrack.server.service;

import com.safetrack.server.controller.dto.request.ChangePasswordRequest;
import com.safetrack.server.controller.dto.request.LoginRequest;
import com.safetrack.server.controller.dto.request.RegisterRequest;
import com.safetrack.server.domain.entity.User;

import java.util.UUID;

public interface AuthService {
    User register(RegisterRequest request);
    User login(LoginRequest request);
    void changePassword(UUID userId, ChangePasswordRequest request);
}
