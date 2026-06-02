ALTER TABLE user_permissions
    ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_user_permissions_org ON user_permissions(organization_id);
CREATE INDEX idx_user_permissions_user_org ON user_permissions(user_id, organization_id);
