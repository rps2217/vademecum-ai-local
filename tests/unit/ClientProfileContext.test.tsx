import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ClientProfileProvider, useClientProfile, type ClientProfile } from '@/contexts/ClientProfileContext';
import type { DbIngredient } from '@/db/schema';

const STORAGE_KEY = 'vademecum-client-profile';

function makeIngredient(overrides: Partial<DbIngredient> = {}): DbIngredient {
  return {
    id: 'test-ing',
    nombre: 'Ingrediente Test',
    categoria: 'fitoterapia',
    propiedades: '',
    mecanismo: '',
    indicaciones: [],
    sintomas: [],
    dosis: '',
    contraindicaciones: [],
    interacciones: [],
    seguridad: { embarazo: 'apto', lactancia: 'apto', pediatria: 'apto', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' },
    evidencia: 'B',
    fuente: 'test',
    tags: [],
    updatedAt: 0,
    ...overrides,
  } as unknown as DbIngredient;
}

function renderProfileHook(initialProfile: ClientProfile = 'ninguno') {
  localStorage.setItem(STORAGE_KEY, initialProfile);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ClientProfileProvider>{children}</ClientProfileProvider>
  );
  return renderHook(() => useClientProfile(), { wrapper });
}

describe('ClientProfileContext — evaluateSafety', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('perfil ninguno', () => {
    it('retorna null cuando no hay perfil activo', () => {
      const { result } = renderProfileHook('ninguno');
      expect(result.current.evaluateSafety(makeIngredient())).toBeNull();
    });
  });

  describe('embarazada', () => {
    it('retorna contraindicado cuando el campo embarazo = contraindicado', () => {
      const ing = makeIngredient({ seguridad: { embarazo: 'contraindicado', lactancia: 'apto', pediatria: 'apto', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' } });
      const { result } = renderProfileHook('embarazada');
      expect(result.current.evaluateSafety(ing)).toBe('contraindicado');
    });

    it('retorna precaucion cuando el campo embarazo = evitar', () => {
      const ing = makeIngredient({ seguridad: { embarazo: 'evitar', lactancia: 'apto', pediatria: 'apto', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' } });
      const { result } = renderProfileHook('embarazada');
      expect(result.current.evaluateSafety(ing)).toBe('precaucion');
    });

    it('retorna apto cuando el campo embarazo = apto', () => {
      const ing = makeIngredient({ seguridad: { embarazo: 'apto', lactancia: 'apto', pediatria: 'apto', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' } });
      const { result } = renderProfileHook('embarazada');
      expect(result.current.evaluateSafety(ing)).toBe('apto');
    });
  });

  describe('lactante', () => {
    it('retorna contraindicado cuando lactancia = contraindicado', () => {
      const ing = makeIngredient({ seguridad: { embarazo: 'apto', lactancia: 'contraindicado', pediatria: 'apto', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' } });
      const { result } = renderProfileHook('lactante');
      expect(result.current.evaluateSafety(ing)).toBe('contraindicado');
    });

    it('retorna precaucion cuando lactancia = evitar', () => {
      const ing = makeIngredient({ seguridad: { embarazo: 'apto', lactancia: 'evitar', pediatria: 'apto', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' } });
      const { result } = renderProfileHook('lactante');
      expect(result.current.evaluateSafety(ing)).toBe('precaucion');
    });
  });

  describe('pediatrico', () => {
    it('retorna contraindicado cuando pediatria = contraindicado', () => {
      const ing = makeIngredient({ seguridad: { embarazo: 'apto', lactancia: 'apto', pediatria: 'contraindicado', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' } });
      const { result } = renderProfileHook('pediatrico');
      expect(result.current.evaluateSafety(ing)).toBe('contraindicado');
    });
  });

  describe('hipertenso', () => {
    it('retorna precaucion por interaccion textual con "hipertens"', () => {
      const ing = makeIngredient({
        seguridad: { embarazo: 'apto', lactancia: 'apto', pediatria: 'apto', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' },
        interacciones: ['Puede elevar la hipertensión arterial'],
      });
      const { result } = renderProfileHook('hipertenso');
      expect(result.current.evaluateSafety(ing)).toBe('precaucion');
    });

    it('retorna precaucion por interaccion con "antihipertens"', () => {
      const ing = makeIngredient({
        interacciones: ['Interfiere con fármacos antihipertensivos'],
      });
      const { result } = renderProfileHook('hipertenso');
      expect(result.current.evaluateSafety(ing)).toBe('precaucion');
    });

    it('retorna precaucion cuando hipertension = evitar', () => {
      const ing = makeIngredient({
        seguridad: { embarazo: 'apto', lactancia: 'apto', pediatria: 'apto', hipertension: 'evitar', diabetes: 'apto', celiacos: 'apto' },
      });
      const { result } = renderProfileHook('hipertenso');
      expect(result.current.evaluateSafety(ing)).toBe('precaucion');
    });

    it('retorna apto cuando no hay interacciones ni campos de riesgo', () => {
      const ing = makeIngredient({ interacciones: [] });
      const { result } = renderProfileHook('hipertenso');
      expect(result.current.evaluateSafety(ing)).toBe('apto');
    });
  });

  describe('diabetico', () => {
    it('retorna precaucion por interaccion textual con "glucos"', () => {
      const ing = makeIngredient({
        interacciones: ['Puede alterar la glucosa en sangre'],
      });
      const { result } = renderProfileHook('diabetico');
      expect(result.current.evaluateSafety(ing)).toBe('precaucion');
    });

    it('retorna precaucion por interaccion con "insulin"', () => {
      const ing = makeIngredient({
        interacciones: ['Potencia el efecto de la insulina'],
      });
      const { result } = renderProfileHook('diabetico');
      expect(result.current.evaluateSafety(ing)).toBe('precaucion');
    });
  });

  describe('anciano', () => {
    it('retorna precaucion por interaccion con "anticoagul"', () => {
      const ing = makeIngredient({
        interacciones: ['Sinergia con anticoagulantes'],
      });
      const { result } = renderProfileHook('anciano');
      expect(result.current.evaluateSafety(ing)).toBe('precaucion');
    });

    it('retorna precaucion por interaccion con "diuret"', () => {
      const ing = makeIngredient({
        interacciones: ['Efecto diuretico leve'],
      });
      const { result } = renderProfileHook('anciano');
      expect(result.current.evaluateSafety(ing)).toBe('precaucion');
    });

    it('retorna apto cuando no hay interacciones relevantes', () => {
      const ing = makeIngredient({ interacciones: ['Otra interaccion generica'] });
      const { result } = renderProfileHook('anciano');
      expect(result.current.evaluateSafety(ing)).toBe('apto');
    });
  });

  describe('cambio dinamico de perfil', () => {
    it('evaluateSafety refleja el perfil cambiado sin re-render manual', () => {
      const ing = makeIngredient({
        seguridad: { embarazo: 'contraindicado', lactancia: 'apto', pediatria: 'apto', hipertension: 'apto', diabetes: 'apto', celiacos: 'apto' },
      });
      const { result } = renderProfileHook('ninguno');

      expect(result.current.evaluateSafety(ing)).toBeNull();

      act(() => result.current.setProfile('embarazada'));
      expect(result.current.evaluateSafety(ing)).toBe('contraindicado');

      act(() => result.current.setProfile('ninguno'));
      expect(result.current.evaluateSafety(ing)).toBeNull();
    });
  });

  describe('persistencia', () => {
    it('setProfile persiste en localStorage', () => {
      const { result } = renderProfileHook('ninguno');
      act(() => result.current.setProfile('diabetico'));
      expect(localStorage.getItem(STORAGE_KEY)).toBe('diabetico');
    });

    it('inicializa desde localStorage', () => {
      localStorage.setItem(STORAGE_KEY, 'lactante');
      const { result } = renderProfileHook('lactante');
      expect(result.current.profile).toBe('lactante');
    });
  });
});

describe('safetyVerdictStyle / safetyVerdictBadge', () => {
  it('safetyVerdictStyle retorna null para verdict null', async () => {
    const { safetyVerdictStyle } = await import('@/contexts/ClientProfileContext');
    expect(safetyVerdictStyle(null)).toBeNull();
  });
});
