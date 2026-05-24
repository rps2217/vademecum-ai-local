import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
    private static instance: SupabaseService;
    private client: SupabaseClient | null = null;
    private configured: boolean = false;

    private constructor() {
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey && supabaseUrl.includes('.supabase.co')) {
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
        return this.client;
    }
    
    isConfigured(): boolean {
        return this.configured;
    }
}

export const supabaseService = SupabaseService.getInstance();
