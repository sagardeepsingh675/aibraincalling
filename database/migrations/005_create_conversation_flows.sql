-- Migration: Create vc_conversation_flows table
-- Purpose: Store conversation flow steps for the AI agent

-- Create the conversation flows table
CREATE TABLE IF NOT EXISTS vc_conversation_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_config_id UUID REFERENCES vc_agent_config(id) ON DELETE CASCADE,
    
    -- Step Information
    step_order INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    step_type VARCHAR(50) NOT NULL, -- 'greeting', 'availability_check', 'pitch', 'objection', 'closing', 'callback'
    
    -- Script Content
    script_template TEXT NOT NULL,
    
    -- Response Handling
    expected_positive TEXT[] DEFAULT ARRAY[]::TEXT[],
    expected_negative TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Next Step Logic
    on_positive_next VARCHAR(100), -- Next step name on positive response
    on_negative_next VARCHAR(100), -- Next step name on negative response
    on_timeout_next VARCHAR(100), -- Next step if no response
    
    -- Settings
    wait_for_response BOOLEAN DEFAULT true,
    max_wait_seconds INTEGER DEFAULT 10,
    is_required BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agent_config_id, step_order)
);

-- Create RLS policies
ALTER TABLE vc_conversation_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON vc_conversation_flows
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow full access for service role" ON vc_conversation_flows
    FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER trigger_vc_conversation_flows_updated_at
    BEFORE UPDATE ON vc_conversation_flows
    FOR EACH ROW
    EXECUTE FUNCTION update_vc_agent_config_updated_at();

-- Insert default conversation flow
-- First, get the default agent config ID
DO $$
DECLARE
    config_id UUID;
BEGIN
    SELECT id INTO config_id FROM vc_agent_config LIMIT 1;
    
    IF config_id IS NOT NULL THEN
        -- Step 1: Greeting
        INSERT INTO vc_conversation_flows (
            agent_config_id, step_order, step_name, step_type,
            script_template, expected_positive, expected_negative,
            on_positive_next, on_negative_next, wait_for_response
        ) VALUES (
            config_id, 1, 'greeting', 'greeting',
            'Namaste! Main {agent_name} bol rahi hoon {company_name} se. Kaise hain aap?',
            ARRAY['theek', 'achha', 'fine', 'good', 'badhiya'],
            ARRAY['busy', 'nahi'],
            'availability_check', 'availability_check', false
        ) ON CONFLICT DO NOTHING;
        
        -- Step 2: Availability Check
        INSERT INTO vc_conversation_flows (
            agent_config_id, step_order, step_name, step_type,
            script_template, expected_positive, expected_negative,
            on_positive_next, on_negative_next, wait_for_response
        ) VALUES (
            config_id, 2, 'availability_check', 'availability_check',
            'Kya aapke paas 2 minute hain? Main aapko ek bahut achhi offer ke baare mein batana chahti hoon.',
            ARRAY['ha', 'haan', 'yes', 'okay', 'bolo', 'batao', 'theek hai', 'bilkul'],
            ARRAY['nahi', 'no', 'abhi nahi', 'baad mein', 'busy', 'time nahi'],
            'pitch', 'callback_schedule', true
        ) ON CONFLICT DO NOTHING;
        
        -- Step 3: Product Pitch
        INSERT INTO vc_conversation_flows (
            agent_config_id, step_order, step_name, step_type,
            script_template, expected_positive, expected_negative,
            on_positive_next, on_negative_next, wait_for_response
        ) VALUES (
            config_id, 3, 'pitch', 'pitch',
            '{pitch_script}',
            ARRAY['interesting', 'achha', 'batao', 'more', 'aur', 'price', 'cost'],
            ARRAY['nahi chahiye', 'not interested', 'no thanks'],
            'closing_positive', 'closing_negative', true
        ) ON CONFLICT DO NOTHING;
        
        -- Step 4: Positive Closing
        INSERT INTO vc_conversation_flows (
            agent_config_id, step_order, step_name, step_type,
            script_template, expected_positive, expected_negative,
            on_positive_next, on_negative_next, wait_for_response
        ) VALUES (
            config_id, 4, 'closing_positive', 'closing',
            '{positive_close_message}',
            ARRAY[]::TEXT[], ARRAY[]::TEXT[],
            NULL, NULL, false
        ) ON CONFLICT DO NOTHING;
        
        -- Step 5: Negative Closing
        INSERT INTO vc_conversation_flows (
            agent_config_id, step_order, step_name, step_type,
            script_template, expected_positive, expected_negative,
            on_positive_next, on_negative_next, wait_for_response
        ) VALUES (
            config_id, 5, 'closing_negative', 'closing',
            '{negative_close_message}',
            ARRAY[]::TEXT[], ARRAY[]::TEXT[],
            NULL, NULL, false
        ) ON CONFLICT DO NOTHING;
        
        -- Step 6: Callback Schedule
        INSERT INTO vc_conversation_flows (
            agent_config_id, step_order, step_name, step_type,
            script_template, expected_positive, expected_negative,
            on_positive_next, on_negative_next, wait_for_response
        ) VALUES (
            config_id, 6, 'callback_schedule', 'callback',
            '{callback_message}',
            ARRAY[]::TEXT[], ARRAY[]::TEXT[],
            'closing_negative', 'closing_negative', true
        ) ON CONFLICT DO NOTHING;
    END IF;
END $$;
