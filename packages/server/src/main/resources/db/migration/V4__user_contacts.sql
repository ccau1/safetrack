CREATE TABLE user_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    alternate_phone_number VARCHAR(50),
    next_of_kin_name VARCHAR(100),
    next_of_kin_relationship VARCHAR(50),
    next_of_kin_phone VARCHAR(50),
    next_of_kin_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id)
);

CREATE INDEX idx_user_contacts_user ON user_contacts(user_id);
