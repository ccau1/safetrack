ALTER TABLE teams
    ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_teams_deleted_at ON teams(deleted_at)
    WHERE deleted_at IS NOT NULL;
