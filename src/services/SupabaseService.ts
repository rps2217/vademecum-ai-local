import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
    private static instance: SupabaseService;
    private client: SupabaseClient;

    private constructor() {
        const fallbackUrl = 'https://pspxqzwxulgmzarlqwtt.supabase.co';
        const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcHhxend4dWxnbXphcmxxd3R0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NzQ1ODQsImV4cCI6MjA5MjE1MDU4NH0.hX0V1F5S6T0I5G1qA1e9D9v1o9Y-H6p9j2V_YI3C1P0'; 
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL || fallbackUrl;
        const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY || fallbackKey;
        
        this.client = createClient(supabaseUrl, supabaseKey);
    }

    static getInstance(): SupabaseService {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }

    getClient(): SupabaseClient {
        return this.client;
    }
}

export const supabaseService = SupabaseService.getInstance();
