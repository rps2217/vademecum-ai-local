import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
    private static instance: SupabaseService;
    private client: SupabaseClient | null = null;
    private configured: boolean = false;

    private constructor() {
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY;
        
        // Block known template dummy prefixes to keep client-side clean of connection failures
        const isDummy = supabaseUrl && (
            supabaseUrl.includes('pspxqzwxulgmzarlqwtt') || 
            supabaseUrl.includes('placeholder') || 
            supabaseUrl.includes('YOUR_SUPABASE')
        );

        if (supabaseUrl && supabaseKey && supabaseUrl.includes('.supabase.co') && !isDummy) {
            this.client = createClient(supabaseUrl, supabaseKey);
            this.configured = true;
        }
    }

    static getInstance(): SupabaseService {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }

    getClient(): SupabaseClient | null {
        if (!this.configured) return null;
        return this.client;
    }
    
    markUnreachable(): void {
        this.configured = false;
    }
    
    isConfigured(): boolean {
        return this.configured;
    }
}

export const supabaseService = SupabaseService.getInstance();
