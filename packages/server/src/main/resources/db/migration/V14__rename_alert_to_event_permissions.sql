-- Rename alert permissions to event permissions for consistency

-- Update permission catalog
UPDATE permissions
SET action = 'safetrack:event:manage',
    description = 'Manage emergency events',
    category = 'Event'
WHERE action = 'safetrack:alert:send';

UPDATE permissions
SET action = 'safetrack:event:read',
    description = 'Read emergency events',
    category = 'Event'
WHERE action = 'safetrack:alert:read';

-- Update any user-specific permission overrides
UPDATE user_permissions
SET action = 'safetrack:event:manage'
WHERE action = 'safetrack:alert:send';

UPDATE user_permissions
SET action = 'safetrack:event:read'
WHERE action = 'safetrack:alert:read';
