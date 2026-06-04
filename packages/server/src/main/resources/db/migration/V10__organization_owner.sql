ALTER TABLE organizations ADD COLUMN owner_id UUID REFERENCES users(id);

-- Backfill: set owner to the first ORG_ADMIN member of each org
UPDATE organizations o
SET owner_id = (
    SELECT m.user_id FROM members m
    WHERE m.organization_id = o.id AND m.org_role = 'ORG_ADMIN'
    ORDER BY m.created_at ASC LIMIT 1
);

-- Fallback: if no ORG_ADMIN found, pick the earliest member
UPDATE organizations o
SET owner_id = (
    SELECT m.user_id FROM members m
    WHERE m.organization_id = o.id
    ORDER BY m.created_at ASC LIMIT 1
)
WHERE owner_id IS NULL;

-- Enforce exactly one owner per org
ALTER TABLE organizations ALTER COLUMN owner_id SET NOT NULL;

-- Index for owner lookups
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
