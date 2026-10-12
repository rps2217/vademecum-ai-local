import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isSupabaseConfigured, getSupabase, testConnection, resetSupabaseClient } from '@/lib/supabase';

const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: mockFrom
    }))
  };
});

describe('Supabase Client & Live Connection', () => {
  beforeEach(() => {
    resetSupabaseClient();
    mockFrom.mockReset();
  });

  it('está configurado con credenciales válidas por defecto', () => {
    expect(isSupabaseConfigured()).toBe(true);
  });

  it('instancia el cliente singleton de Supabase sin errores', () => {
    const client = getSupabase();
    expect(client).toBeDefined();
    expect(client?.from).toBeDefined();
  });

  it('verifica la conexión activa y la disponibilidad de tablas en Supabase', async () => {
    // Simular respuestas exitosas para products e ingredients
    mockFrom.mockImplementation((table: string) => {
      return {
        select: vi.fn().mockResolvedValue({
          count: table === 'products' ? 20 : 100,
          error: null
        })
      };
    });

    const result = await testConnection();
    expect(result.success).toBe(true);
    expect(result.message).toContain('productos');
  });

  it('maneja fallos de conexión cuando la tabla no existe', async () => {
    // Simular error de tabla inexistente para products
    mockFrom.mockImplementation(() => {
      return {
        select: vi.fn().mockResolvedValue({
          count: null,
          error: { code: '42P01', message: 'relation "products" does not exist' }
        })
      };
    });

    const result = await testConnection();
    expect(result.success).toBe(false);
    expect(result.message).toContain('no existe');
  });
});
