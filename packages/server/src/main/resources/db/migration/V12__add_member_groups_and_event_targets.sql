-- Member groups (flat, org-scoped)
CREATE TABLE member_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_member_groups_organization ON member_groups(organization_id);

-- Group memberships
CREATE TABLE member_group_memberships (
    group_id UUID NOT NULL REFERENCES member_groups(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, member_id)
);

CREATE INDEX idx_member_group_memberships_member ON member_group_memberships(member_id);

-- Emergency event target teams
CREATE TABLE emergency_event_target_teams (
    emergency_event_id UUID NOT NULL REFERENCES emergency_events(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    PRIMARY KEY (emergency_event_id, team_id)
);

CREATE INDEX idx_emergency_event_target_teams_team ON emergency_event_target_teams(team_id);

-- Emergency event target groups
CREATE TABLE emergency_event_target_groups (
    emergency_event_id UUID NOT NULL REFERENCES emergency_events(id) ON DELETE CASCADE,
    member_group_id UUID NOT NULL REFERENCES member_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (emergency_event_id, member_group_id)
);

CREATE INDEX idx_emergency_event_target_groups_group ON emergency_event_target_groups(member_group_id);
