/**
 * Test setup for Vitest
 */

import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// jsdom no implementa scrollIntoView; los componentes que lo usan lo llaman
// opcionalmente (?.) pero el método debe existir en el prototype.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = function () {};
}

// El entorno de test NO debe tener Supabase configurado, aunque exista un
// .env.local con credenciales reales. Muchos tests asumen que la app funciona
// en modo local sin sync. Vitest carga .env.local automáticamente; aquí lo
// neutralizamos para que isSupabaseConfigured() devuelva false en los tests.
delete (import.meta.env as Record<string, unknown>).VITE_SUPABASE_URL;
delete (import.meta.env as Record<string, unknown>).VITE_SUPABASE_ANON_KEY;
