-- Teams inside groups
CREATE TABLE member_group_teams (
    group_id UUID NOT NULL REFERENCES member_groups(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, team_id)
);

CREATE INDEX idx_member_group_teams_team ON member_group_teams(team_id);
