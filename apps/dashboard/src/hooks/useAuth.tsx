import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, TenantUser, SIPAccount, CallingLimits } from '../lib/supabase';

interface AuthContextType {
    user: TenantUser | null;
    sipAccounts: SIPAccount[];
    callingLimits: CallingLimits | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simple hash function to match the admin panel
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<TenantUser | null>(null);
    const [sipAccounts, setSipAccounts] = useState<SIPAccount[]>([]);
    const [callingLimits, setCallingLimits] = useState<CallingLimits | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const savedUser = localStorage.getItem('dashboard_user');
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            fetchUserData(userData.id);
        }
        setLoading(false);
    }, []);

    const fetchUserData = async (userId: string) => {
        // Fetch SIP accounts
        const { data: sips } = await supabase
            .from('sip_accounts')
            .select('*')
            .eq('user_id', userId);
        setSipAccounts(sips || []);

        // Fetch calling limits
        const { data: limits } = await supabase
            .from('calling_limits')
            .select('*')
            .eq('user_id', userId)
            .single();
        setCallingLimits(limits);
    };

    const signIn = async (email: string, password: string) => {
        setLoading(true);

        // Hash the password and check against stored hash
        const passwordHash = simpleHash(password);

        const { data: userData, error } = await supabase
            .from('tenant_users')
            .select('*')
            .eq('email', email)
            .eq('password_hash', passwordHash)
            .eq('is_active', true)
            .single();

        if (error || !userData) {
            setLoading(false);
            throw new Error('Invalid email or password');
        }

        setUser(userData);
        localStorage.setItem('dashboard_user', JSON.stringify(userData));
        await fetchUserData(userData.id);
        setLoading(false);
    };

    const signOut = () => {
        setUser(null);
        setSipAccounts([]);
        setCallingLimits(null);
        localStorage.removeItem('dashboard_user');
    };

    return (
        <AuthContext.Provider value={{ user, sipAccounts, callingLimits, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
