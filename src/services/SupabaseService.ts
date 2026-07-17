import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseService {
    private static instance: SupabaseService;
    private client: SupabaseClient | null = null;
    private configured: boolean = false;

    private constructor() {
        const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL;
        const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY;

        // Block only generic placeholder/template URLs (not real project URLs)
        const isDummy = supabaseUrl && (
            supabaseUrl.includes('placeholder') ||
            supabaseUrl.includes('YOUR_SUPABASE') ||
            supabaseUrl.includes('yourproject')
        );

        // Also check if key looks like a template placeholder
        const keyIsDummy = supabaseKey && (
            supabaseKey.includes('placeholder') ||
            supabaseKey.includes('your-') ||
            supabaseKey === '' ||
            supabaseKey.includes('example')
        );

        if (supabaseUrl && supabaseKey && supabaseUrl.includes('.supabase.co') && !isDummy && !keyIsDummy) {
            try {
                this.client = createClient(supabaseUrl, supabaseKey);
                this.configured = true;
                console.log('[SupabaseService] Conectado a:', supabaseUrl);
            } catch (error) {
                console.error('[SupabaseService] Error creando cliente:', error);
                this.configured = false;
            }
        } else {
            if (supabaseUrl && !isDummy && !keyIsDummy) {
                console.warn('[SupabaseService] URL configurada pero sin clave valida');
            }
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
