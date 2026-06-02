CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Rename existing roles to new naming
UPDATE roles SET name = 'USER' WHERE name = 'EMPLOYEE';
DELETE FROM roles WHERE name = 'SAFETY_OFFICER';
INSERT INTO roles (name) VALUES ('SUPER_ADMIN') ON CONFLICT DO NOTHING;

-- User-specific permissions (inline policy overrides)
CREATE TABLE user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    effect VARCHAR(10) NOT NULL CHECK (effect IN ('Allow', 'Deny')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, action)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);

-- Permission catalog (for admin UI and validation)
CREATE TABLE permissions (
    action VARCHAR(100) PRIMARY KEY,
    description TEXT,
    category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
