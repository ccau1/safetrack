package com.safetrack.server.service;

import com.safetrack.server.controller.dto.request.LoginRequest;
import com.safetrack.server.controller.dto.request.RegisterRequest;
import com.safetrack.server.domain.entity.User;

public interface AuthService {
    User register(RegisterRequest request);
    User login(LoginRequest request);
}
