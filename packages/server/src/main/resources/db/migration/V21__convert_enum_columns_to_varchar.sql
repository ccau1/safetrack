-- Convert PostgreSQL ENUM columns to VARCHAR so they work with @Enumerated(EnumType.STRING)
-- and Spring Data JPA derived queries without operator-mismatch errors.

ALTER TABLE contact_points
    ALTER COLUMN type TYPE VARCHAR(20),
    ALTER COLUMN category TYPE VARCHAR(20);

ALTER TABLE escalation_rule_steps
    ALTER COLUMN contact_point_type TYPE VARCHAR(20);

ALTER TABLE alert_dispatches
    ALTER COLUMN channel TYPE VARCHAR(20);
