import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './LoggerService';

export class SupabaseService {
    private static instance: SupabaseService;
    private client: SupabaseClient | null = null;
    private configured: boolean = false;
    private currentUrl: string = '';

    private constructor() {
        this.initializeClient();
        
        // Listen for storage changes (from SupabaseSetup)
        if (typeof window !== 'undefined') {
            window.addEventListener('storage', () => {
                this.initializeClient();
            });
        }
    }

    private initializeClient(): void {
        // Try localStorage first (from SupabaseSetup component)
        const localUrl = localStorage.getItem('supabase_url');
        const localKey = localStorage.getItem('supabase_anon_key');
        
        // Fall back to environment variables
        const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || (window as any)._env_?.VITE_SUPABASE_URL;
        const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || (window as any)._env_?.VITE_SUPABASE_ANON_KEY;

        const supabaseUrl = localUrl || envUrl;
        const supabaseKey = localKey || envKey;

        // Block only generic placeholder/template URLs
        const isDummy = supabaseUrl && (
            supabaseUrl.includes('placeholder') ||
            supabaseUrl.includes('YOUR_SUPABASE') ||
            supabaseUrl.includes('yourproject')
        );

        // Check if key looks like a template placeholder
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
                this.currentUrl = supabaseUrl;
                logger.info(`Conectado a Supabase: ${supabaseUrl.replace(/\/\/.*@/, '//***@')}`, 'SupabaseService');
            } catch (error) {
                logger.error('Error creando cliente Supabase', 'SupabaseService', error);
                this.configured = false;
            }
        } else {
            this.configured = false;
            if (supabaseUrl && !isDummy && !keyIsDummy) {
                logger.warn('URL configurada pero sin clave válida', 'SupabaseService');
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
        if (!this.configured) {
            // Try re-initializing
            this.initializeClient();
        }
        return this.client;
    }

    markUnreachable(): void {
        this.configured = false;
    }

    isConfigured(): boolean {
        return this.configured;
    }
    
    getConnectedUrl(): string {
        return this.currentUrl;
    }
}

export const supabaseService = SupabaseService.getInstance();
