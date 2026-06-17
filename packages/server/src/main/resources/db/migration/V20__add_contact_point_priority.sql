ALTER TABLE contact_points ADD COLUMN priority INT NOT NULL DEFAULT 0;

-- Backfill: assign incremental priority per user based on creation order
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 AS new_priority
    FROM contact_points
)
UPDATE contact_points cp
SET priority = r.new_priority
FROM ranked r
WHERE cp.id = r.id;

CREATE INDEX idx_contact_points_user_priority ON contact_points(user_id, priority);
