import { describe, it, expect } from 'vitest';
import { isSupabaseConfigured, getSupabase, testConnection } from '@/lib/supabase';

describe('Supabase Client & Live Connection', () => {
  it('está configurado con credenciales válidas por defecto', () => {
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('instancia el cliente singleton de Supabase sin errores', () => {
    const client = getSupabase();
    expect(client).toBeDefined();
    expect(client?.from).toBeDefined();
  });

  it('verifica la conexión activa y la disponibilidad de tablas en Supabase', async () => {
    const result = await testConnection();
    expect(result.success).toBe(true);
    expect(result.message).toContain('productos');
  });
});
