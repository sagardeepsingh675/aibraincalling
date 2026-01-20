-- ===========================================
-- Initial Schema Migration
-- AI Voice Calling Platform
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- LEADS TABLE
-- ===========================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_timestamp TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for phone lookup
CREATE INDEX idx_leads_phone ON leads(phone);
-- Index for status filtering
CREATE INDEX idx_leads_status ON leads(status);
-- Index for created_at sorting
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- ===========================================
-- AI AGENTS TABLE
-- ===========================================
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    voice_id VARCHAR(255) NOT NULL,
    prompt_template TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- CALLS TABLE
-- ===========================================
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id),
    status VARCHAR(50) NOT NULL DEFAULT 'queued',
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration INTEGER, -- in seconds
    asterisk_channel VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lead lookup
CREATE INDEX idx_calls_lead_id ON calls(lead_id);
-- Index for status
CREATE INDEX idx_calls_status ON calls(status);
-- Index for date range queries
CREATE INDEX idx_calls_started_at ON calls(started_at DESC);

-- ===========================================
-- CALL LOGS TABLE (Conversation Transcript)
-- ===========================================
CREATE TABLE call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    speaker VARCHAR(20) NOT NULL CHECK (speaker IN ('user', 'agent', 'system')),
    message TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for call lookup
CREATE INDEX idx_call_logs_call_id ON call_logs(call_id);

-- ===========================================
-- RECORDINGS TABLE
-- ===========================================
CREATE TABLE recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    duration INTEGER, -- in seconds
    file_size INTEGER, -- in bytes
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for call lookup
CREATE UNIQUE INDEX idx_recordings_call_id ON recordings(call_id);

-- ===========================================
-- UPDATED_AT TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER agents_updated_at
    BEFORE UPDATE ON agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access" ON leads
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON agents
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON calls
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON call_logs
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access" ON recordings
    FOR ALL
    USING (auth.role() = 'service_role');

-- Anonymous users can only insert leads (with consent)
CREATE POLICY "Anonymous can insert leads" ON leads
    FOR INSERT
    WITH CHECK (consent_given = true);

-- ===========================================
-- INSERT DEFAULT AGENT
-- ===========================================
INSERT INTO agents (name, voice_id, prompt_template, is_active)
VALUES (
    'Main Sales Agent',
    'default-hindi-voice',
    'You are a friendly AI assistant speaking in Hindi-English mix.',
    true
);
