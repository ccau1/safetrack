-- Rename events table to emergency_events
ALTER TABLE events RENAME TO emergency_events;
ALTER INDEX idx_events_organization RENAME TO idx_emergency_events_organization;
ALTER INDEX idx_events_status RENAME TO idx_emergency_events_status;
ALTER INDEX idx_events_started_at RENAME TO idx_emergency_events_started_at;

-- Rename status_reports table to member_emergency_status_reports
ALTER TABLE status_reports RENAME TO member_emergency_status_reports;
ALTER INDEX idx_status_reports_event RENAME TO idx_member_emergency_status_reports_event;
ALTER INDEX idx_status_reports_member RENAME TO idx_member_emergency_status_reports_member;
ALTER INDEX idx_status_reports_created_at RENAME TO idx_member_emergency_status_reports_created_at;

-- Rename FK columns for explicitness
ALTER TABLE member_emergency_status_reports RENAME COLUMN event_id TO emergency_event_id;

-- Update notifications table FK columns
ALTER TABLE notifications RENAME COLUMN event_id TO emergency_event_id;
ALTER TABLE notifications RENAME COLUMN status_report_id TO member_emergency_status_report_id;

-- Rename notification indexes
ALTER INDEX idx_notifications_event RENAME TO idx_notifications_emergency_event;

-- Create emergency_event_updates table
CREATE TABLE emergency_event_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_event_id UUID NOT NULL REFERENCES emergency_events(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_emergency_event_updates_event ON emergency_event_updates(emergency_event_id);
CREATE INDEX idx_emergency_event_updates_created_at ON emergency_event_updates(created_at DESC);
