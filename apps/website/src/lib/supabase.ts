import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bhvsmoqsotbfugkbcbns.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
    console.warn('VITE_SUPABASE_ANON_KEY not set. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Voice Calling Lead Type
export type VCLead = {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    consent_given: boolean;
    consent_timestamp: string | null;
    status: 'pending' | 'calling' | 'completed' | 'failed' | 'no_answer';
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export async function submitLead(data: {
    name: string;
    phone: string;
    email?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.from('vc_leads').insert({
            name: data.name,
            phone: data.phone,
            email: data.email || null,
            consent_given: true,
            consent_timestamp: new Date().toISOString(),
            status: 'pending',
        });

        if (error) {
            console.error('Supabase error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Submit error:', err);
        return { success: false, error: 'Failed to submit. Please try again.' };
    }
}
