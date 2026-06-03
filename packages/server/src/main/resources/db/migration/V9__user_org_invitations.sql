CREATE TYPE user_org_invitation_status AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED');

CREATE TABLE user_org_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
    org_role VARCHAR(20) NOT NULL DEFAULT 'ORG_MEMBER',
    status user_org_invitation_status NOT NULL DEFAULT 'PENDING',
    invited_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES users(id),
    invited_first_name VARCHAR(100),
    invited_last_name VARCHAR(100),
    phone_number VARCHAR(50),
    alternate_phone_number VARCHAR(50),
    next_of_kin_name VARCHAR(100),
    next_of_kin_relationship VARCHAR(50),
    next_of_kin_phone VARCHAR(50),
    next_of_kin_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_org_invitations_token ON user_org_invitations(token);
CREATE INDEX idx_user_org_invitations_org_status ON user_org_invitations(organization_id, status);
CREATE INDEX idx_user_org_invitations_email ON user_org_invitations(email);
