-- Change status column from PostgreSQL enum to VARCHAR so Hibernate @Enumerated(EnumType.STRING) works correctly
ALTER TABLE user_org_invitations ALTER COLUMN status TYPE VARCHAR(20);
