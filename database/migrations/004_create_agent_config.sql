-- Migration: Create vc_agent_config table
-- Purpose: Store AI agent configuration for voice calls

-- Create the agent config table
CREATE TABLE IF NOT EXISTS vc_agent_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Agent Persona
    agent_name VARCHAR(100) NOT NULL DEFAULT 'AI Assistant',
    company_name VARCHAR(200) NOT NULL DEFAULT 'Your Company',
    voice_style VARCHAR(50) DEFAULT 'friendly', -- formal, casual, friendly
    
    -- Greeting Configuration
    greeting_template TEXT NOT NULL DEFAULT 'Namaste! Main {agent_name} bol rahi hoon {company_name} se. Kya aapke paas 2 minute hain?',
    
    -- Availability Check
    availability_question TEXT DEFAULT 'Kya aapke paas 2 minute hain?',
    positive_responses TEXT[] DEFAULT ARRAY['ha', 'haan', 'yes', 'bilkul', 'ji', 'theek hai', 'okay', 'bolo', 'batao'],
    negative_responses TEXT[] DEFAULT ARRAY['nahi', 'no', 'abhi nahi', 'baad mein', 'busy', 'time nahi'],
    
    -- Product Pitch
    pitch_script TEXT DEFAULT 'Main aapko ek bahut achha product ke baare mein batana chahti hoon jo aapke liye bahut useful ho sakta hai.',
    pitch_key_points TEXT[] DEFAULT ARRAY['Product benefit 1', 'Product benefit 2', 'Special offer'],
    
    -- Objection Handling
    objection_responses JSONB DEFAULT '{}',
    
    -- Closing
    positive_close_message TEXT DEFAULT 'Bahut shukriya! Main aapko details share kar deti hoon. Aapka din achha guzre!',
    negative_close_message TEXT DEFAULT 'Koi baat nahi! Agar future mein interest ho toh zaroor contact kijiyega. Thank you!',
    callback_message TEXT DEFAULT 'Accha ji, kab call kar sakti hoon? Main note kar leti hoon.',
    
    -- Settings
    max_turns INTEGER DEFAULT 10,
    recording_enabled BOOLEAN DEFAULT true,
    analytics_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create RLS policies
ALTER TABLE vc_agent_config ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read config
CREATE POLICY "Allow read access for authenticated users" ON vc_agent_config
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role full access
CREATE POLICY "Allow full access for service role" ON vc_agent_config
    FOR ALL USING (auth.role() = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vc_agent_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vc_agent_config_updated_at
    BEFORE UPDATE ON vc_agent_config
    FOR EACH ROW
    EXECUTE FUNCTION update_vc_agent_config_updated_at();

-- Insert default configuration
INSERT INTO vc_agent_config (
    agent_name,
    company_name,
    voice_style,
    greeting_template,
    pitch_script,
    pitch_key_points
) VALUES (
    'Priya',
    'AI Solutions',
    'friendly',
    'Namaste! Main {agent_name} bol rahi hoon {company_name} se. Kaise hain aap? Kya aapke paas do minute hain?',
    'Main aapko batana chahti hoon ki humare paas ek bahut hi innovative AI solution hai jo aapke business ko 10x grow kar sakta hai. Ye completely automated hai aur aapka bahut time bacha sakta hai.',
    ARRAY[
        'Completely automated AI system',
        '10x business growth potential',
        'Save hours of manual work daily',
        'Special launch pricing available'
    ]
) ON CONFLICT DO NOTHING;
