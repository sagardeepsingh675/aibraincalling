-- ===========================================
-- Webhook Trigger for New Leads
-- AI Voice Calling Platform
-- ===========================================

-- Function to call webhook when new lead is inserted
CREATE OR REPLACE FUNCTION notify_new_lead()
RETURNS TRIGGER AS $$
DECLARE
    payload JSON;
BEGIN
    -- Build payload
    payload := json_build_object(
        'type', 'INSERT',
        'table', 'leads',
        'record', row_to_json(NEW)
    );
    
    -- Send to webhook (using pg_net extension or Supabase Edge Functions)
    -- This can be configured via Supabase Dashboard > Database > Webhooks
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_new_lead ON leads;
CREATE TRIGGER on_new_lead
    AFTER INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_lead();

-- ===========================================
-- Function to Update Lead Status After Call
-- ===========================================
CREATE OR REPLACE FUNCTION update_lead_status_after_call()
RETURNS TRIGGER AS $$
BEGIN
    -- Update lead status when call completes or fails
    IF NEW.status IN ('completed', 'failed', 'no_answer') THEN
        UPDATE leads
        SET status = NEW.status,
            updated_at = NOW()
        WHERE id = NEW.lead_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_call_status_change ON calls;
CREATE TRIGGER on_call_status_change
    AFTER UPDATE OF status ON calls
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_lead_status_after_call();
