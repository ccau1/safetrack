package com.safetrack.server.security;

import com.safetrack.server.domain.entity.Role;
import com.safetrack.server.domain.entity.User;
import com.safetrack.shared.security.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private final JwtParser jwtParser;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user, UUID organizationId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpirationMs);

        String roles = user.getRoles().stream()
                .map(Role::getName)
                .map(Enum::name)
                .collect(Collectors.joining(","));

        var builder = Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getKey());

        if (organizationId != null) {
            builder.claim("org_id", organizationId.toString());
        }

        return builder.compact();
    }

    public boolean isTokenValid(String token) {
        return jwtParser.isTokenValid(token);
    }

    public String extractEmail(String token) {
        return jwtParser.extractEmail(token);
    }

    public UUID extractOrganizationId(String token) {
        return jwtParser.extractOrganizationId(token);
    }
}
