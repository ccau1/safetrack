CREATE TYPE escalation_action_type AS ENUM ('CONTACT_POINT', 'NOTIFY_SUPERVISOR', 'NOTIFY_EMERGENCY_CONTACT');
CREATE TYPE alert_dispatch_status AS ENUM ('SENT', 'DELIVERED', 'FAILED', 'REPLIED', 'NO_RESPONSE');

-- Member supervisor relationship (org-scoped)
ALTER TABLE members
    ADD COLUMN supervisor_member_id UUID REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX idx_members_supervisor ON members(supervisor_member_id);

-- Escalation rules defined by users
CREATE TABLE escalation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Default',
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, name)
);

CREATE INDEX idx_escalation_rules_user ON escalation_rules(user_id);

-- Steps within an escalation rule
CREATE TABLE escalation_rule_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escalation_rule_id UUID NOT NULL REFERENCES escalation_rules(id) ON DELETE CASCADE,
    step_order INT NOT NULL,
    action_type escalation_action_type NOT NULL,
    contact_point_type contact_point_type,
    contact_point_id UUID REFERENCES contact_points(id) ON DELETE SET NULL,
    wait_duration_minutes INT NOT NULL DEFAULT 5,
    message_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (escalation_rule_id, step_order)
);

CREATE INDEX idx_escalation_rule_steps_rule ON escalation_rule_steps(escalation_rule_id);

-- Alert dispatches (track every outbound alert and its response)
CREATE TABLE alert_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_event_id UUID REFERENCES emergency_events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    escalation_rule_step_id UUID REFERENCES escalation_rule_steps(id) ON DELETE SET NULL,
    contact_point_id UUID REFERENCES contact_points(id) ON DELETE SET NULL,
    channel contact_point_type,
    message TEXT,
    status alert_dispatch_status NOT NULL DEFAULT 'SENT',
    response_value VARCHAR(50),
    twilio_sid VARCHAR(100),
    dispatched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alert_dispatches_event ON alert_dispatches(emergency_event_id);
CREATE INDEX idx_alert_dispatches_member ON alert_dispatches(member_id);
CREATE INDEX idx_alert_dispatches_status ON alert_dispatches(status);
CREATE INDEX idx_alert_dispatches_twilio ON alert_dispatches(twilio_sid) WHERE twilio_sid IS NOT NULL;
