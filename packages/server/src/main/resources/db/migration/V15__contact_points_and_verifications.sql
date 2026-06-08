CREATE TYPE contact_point_type AS ENUM ('EMAIL', 'PHONE', 'SMS');
CREATE TYPE contact_point_category AS ENUM ('SELF', 'EMERGENCY_CONTACT');
CREATE TYPE challenge_purpose AS ENUM ('VERIFY_CONTACT', 'PASSWORD_RESET');
CREATE TYPE challenge_method AS ENUM ('EMAIL_LINK', 'EMAIL_CODE', 'SMS_CODE');
CREATE TYPE challenge_status AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'CANCELLED');

CREATE TABLE contact_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type contact_point_type NOT NULL,
    value VARCHAR(255) NOT NULL,
    label VARCHAR(50) NOT NULL DEFAULT 'Primary',
    category contact_point_category NOT NULL DEFAULT 'SELF',
    verified_at TIMESTAMP WITH TIME ZONE,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, type, value)
);

CREATE INDEX idx_contact_points_user ON contact_points(user_id);
CREATE INDEX idx_contact_points_user_type ON contact_points(user_id, type);
CREATE INDEX idx_contact_points_verified ON contact_points(user_id, type, verified_at) WHERE verified_at IS NOT NULL;

CREATE TABLE verification_challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_point_id UUID NOT NULL REFERENCES contact_points(id) ON DELETE CASCADE,
    purpose challenge_purpose NOT NULL DEFAULT 'VERIFY_CONTACT',
    method challenge_method NOT NULL,
    token_hash VARCHAR(64),
    code_hash VARCHAR(64),
    status challenge_status NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    attempt_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_challenges_contact_point ON verification_challenges(contact_point_id);
CREATE INDEX idx_verification_challenges_token ON verification_challenges(token_hash) WHERE token_hash IS NOT NULL;
CREATE INDEX idx_verification_challenges_code ON verification_challenges(code_hash) WHERE code_hash IS NOT NULL;
CREATE INDEX idx_verification_challenges_status_expires ON verification_challenges(status, expires_at);

-- Track login email verification on users table
ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE;

-- Mark all existing users as having a verified login email (backward compatibility)
UPDATE users SET email_verified_at = NOW();

-- Migrate existing user_contacts data into contact_points
DO $$
DECLARE
    uc RECORD;
BEGIN
    FOR uc IN SELECT * FROM user_contacts LOOP
        IF uc.email IS NOT NULL AND uc.email <> '' THEN
            INSERT INTO contact_points (user_id, type, value, label, category, is_primary, verified_at)
            VALUES (uc.user_id, 'EMAIL', uc.email, 'Primary', 'SELF', true, NOW())
            ON CONFLICT (user_id, type, value) DO NOTHING;
        END IF;

        IF uc.phone_number IS NOT NULL AND uc.phone_number <> '' THEN
            INSERT INTO contact_points (user_id, type, value, label, category, is_primary, verified_at)
            VALUES (uc.user_id, 'PHONE', uc.phone_number, 'Primary', 'SELF', true, NOW())
            ON CONFLICT (user_id, type, value) DO NOTHING;
        END IF;

        IF uc.alternate_phone_number IS NOT NULL AND uc.alternate_phone_number <> '' THEN
            INSERT INTO contact_points (user_id, type, value, label, category, is_primary, verified_at)
            VALUES (uc.user_id, 'PHONE', uc.alternate_phone_number, 'Alternate', 'SELF', false, NOW())
            ON CONFLICT (user_id, type, value) DO NOTHING;
        END IF;

        IF uc.next_of_kin_phone IS NOT NULL AND uc.next_of_kin_phone <> '' THEN
            INSERT INTO contact_points (user_id, type, value, label, category, is_primary, verified_at)
            VALUES (uc.user_id, 'PHONE', uc.next_of_kin_phone, 'Next of Kin', 'EMERGENCY_CONTACT', false, NOW())
            ON CONFLICT (user_id, type, value) DO NOTHING;
        END IF;

        IF uc.next_of_kin_email IS NOT NULL AND uc.next_of_kin_email <> '' THEN
            INSERT INTO contact_points (user_id, type, value, label, category, is_primary, verified_at)
            VALUES (uc.user_id, 'EMAIL', uc.next_of_kin_email, 'Next of Kin', 'EMERGENCY_CONTACT', false, NOW())
            ON CONFLICT (user_id, type, value) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- Create contact points for all users' login emails (skip if already exists from migration above)
INSERT INTO contact_points (user_id, type, value, label, category, is_primary, verified_at)
SELECT u.id, 'EMAIL', u.email, 'Login', 'SELF', true, NOW()
FROM users u
WHERE u.email IS NOT NULL AND u.email <> ''
  AND NOT EXISTS (
    SELECT 1 FROM contact_points cp
    WHERE cp.user_id = u.id AND cp.type = 'EMAIL' AND cp.value = u.email
)
ON CONFLICT (user_id, type, value) DO NOTHING;

-- Add FK columns to user_contacts for next-of-kin contact points
ALTER TABLE user_contacts
    ADD COLUMN next_of_kin_phone_contact_point_id UUID REFERENCES contact_points(id) ON DELETE SET NULL,
    ADD COLUMN next_of_kin_email_contact_point_id UUID REFERENCES contact_points(id) ON DELETE SET NULL;

-- Link next-of-kin contact points back to user_contacts
UPDATE user_contacts uc
SET next_of_kin_phone_contact_point_id = cp.id
FROM contact_points cp
WHERE uc.user_id = cp.user_id
  AND cp.type = 'PHONE'
  AND cp.category = 'EMERGENCY_CONTACT';

UPDATE user_contacts uc
SET next_of_kin_email_contact_point_id = cp.id
FROM contact_points cp
WHERE uc.user_id = cp.user_id
  AND cp.type = 'EMAIL'
  AND cp.category = 'EMERGENCY_CONTACT';

-- Drop old contact value columns from user_contacts
ALTER TABLE user_contacts
    DROP COLUMN email,
    DROP COLUMN phone_number,
    DROP COLUMN alternate_phone_number,
    DROP COLUMN next_of_kin_phone,
    DROP COLUMN next_of_kin_email;
