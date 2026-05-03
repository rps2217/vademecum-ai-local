import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
    private static instance: SupabaseService;
    private client: SupabaseClient | null = null;

    private constructor() {
        // Credentials come exclusively from environment variables (set in .env, exposed by Vite).
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

        if (supabaseUrl && supabaseKey) {
            this.client = createClient(supabaseUrl, supabaseKey);
        } else {
            console.warn('[SupabaseService] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no configuradas. Cloud sync deshabilitado.');
        }
    }

    static getInstance(): SupabaseService {
        if (!SupabaseService.instance) {
            SupabaseService.instance = new SupabaseService();
        }
        return SupabaseService.instance;
    }

    getClient(): SupabaseClient {
        if (!this.client) {
            throw new Error('Supabase no está configurado. Verifique que VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY estén definidos en el archivo .env');
        }
        return this.client;
    }

    isConfigured(): boolean {
        return this.client !== null;
    }
}

export const supabaseService = SupabaseService.getInstance();
