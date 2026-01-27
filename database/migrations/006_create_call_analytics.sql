-- Migration: Create vc_call_analytics table
-- Purpose: Store call analytics for AI self-learning

CREATE TABLE IF NOT EXISTS vc_call_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID REFERENCES vc_calls(id) ON DELETE CASCADE,
    
    -- Flow Tracking
    steps_completed TEXT[] DEFAULT ARRAY[]::TEXT[],
    current_step VARCHAR(100),
    
    -- Outcome Metrics
    pitch_delivered BOOLEAN DEFAULT false,
    user_interested BOOLEAN DEFAULT false,
    callback_scheduled BOOLEAN DEFAULT false,
    call_successful BOOLEAN DEFAULT false,
    
    -- Engagement Metrics
    user_engagement_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 1.00
    conversation_turns INTEGER DEFAULT 0,
    total_duration_seconds INTEGER DEFAULT 0,
    
    -- User Responses
    positive_responses_count INTEGER DEFAULT 0,
    negative_responses_count INTEGER DEFAULT 0,
    unclear_responses_count INTEGER DEFAULT 0,
    
    -- Objections
    objections_raised TEXT[] DEFAULT ARRAY[]::TEXT[],
    objections_handled BOOLEAN DEFAULT false,
    
    -- Conversation Log
    conversation_summary TEXT,
    ai_observations JSONB DEFAULT '{}',
    
    -- Follow-up
    callback_time TIMESTAMPTZ,
    follow_up_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics queries
CREATE INDEX idx_vc_call_analytics_call_id ON vc_call_analytics(call_id);
CREATE INDEX idx_vc_call_analytics_call_successful ON vc_call_analytics(call_successful);
CREATE INDEX idx_vc_call_analytics_created_at ON vc_call_analytics(created_at);

-- Create RLS policies
ALTER TABLE vc_call_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON vc_call_analytics
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for service role" ON vc_call_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Create a view for analytics dashboard
CREATE OR REPLACE VIEW vc_analytics_summary AS
SELECT 
    DATE(created_at) as call_date,
    COUNT(*) as total_calls,
    COUNT(*) FILTER (WHERE call_successful = true) as successful_calls,
    COUNT(*) FILTER (WHERE pitch_delivered = true) as pitches_delivered,
    COUNT(*) FILTER (WHERE user_interested = true) as interested_users,
    COUNT(*) FILTER (WHERE callback_scheduled = true) as callbacks_scheduled,
    AVG(user_engagement_score) as avg_engagement,
    AVG(conversation_turns) as avg_turns,
    AVG(total_duration_seconds) as avg_duration
FROM vc_call_analytics
GROUP BY DATE(created_at)
ORDER BY call_date DESC;

-- Create updated_at trigger
CREATE TRIGGER trigger_vc_call_analytics_updated_at
    BEFORE UPDATE ON vc_call_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_vc_agent_config_updated_at();
