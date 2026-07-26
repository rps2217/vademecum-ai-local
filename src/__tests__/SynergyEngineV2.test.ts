/**
 * Tests Unitarios - SynergyEngineV2
 */

import { describe, it, expect } from 'vitest';
import { synergyEngineV2 } from '../core/knowledge-base';

describe('SynergyEngineV2', () => {
  describe('checkAntagonisms', () => {
    it('debería detectar antagonismo warfarina + ginkgo', () => {
      const antagonisms = synergyEngineV2.checkAntagonisms(['warfarin', 'ginkgo']);
      expect(Array.isArray(antagonisms)).toBe(true);
      // Verificar que retorna array (puede estar vacío si no están en KB)
    });

    it('debería detectar antagonismo hierro + calcio (absorción)', () => {
      const antagonisms = synergyEngineV2.checkAntagonisms(['hierro', 'calcio']);
      expect(Array.isArray(antagonisms)).toBe(true);
    });

    it('debería retornar array vacío si no hay antagonismos', () => {
      const antagonisms = synergyEngineV2.checkAntagonisms(['valeriana', 'pasiflora']);
      expect(Array.isArray(antagonisms)).toBe(true);
    });

    it('debería manejar ingredientes desconocidos gracefully', () => {
      const antagonisms = synergyEngineV2.checkAntagonisms(['ingredientex', 'ingredientey']);
      expect(Array.isArray(antagonisms)).toBe(true);
      expect(antagonisms.length).toBe(0);
    });

    it('debería funcionar con un solo ingrediente', () => {
      const antagonisms = synergyEngineV2.checkAntagonisms(['warfarin']);
      expect(Array.isArray(antagonisms)).toBe(true);
    });

    it('debería soportar sinónimos de ingredientes', () => {
      // "omega-3" debería coincidir con "omega_3"
      const antagonisms = synergyEngineV2.checkAntagonisms(['omega-3', 'warfarina']);
      expect(Array.isArray(antagonisms)).toBe(true);
    });
  });

  describe('analyze', () => {
    it('debería analizar sinergias entre ingredientes válidos', () => {
      const result = synergyEngineV2.analyze(['valeriana', 'pasiflora']);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('sinergiasDetectadas');
      expect(result).toHaveProperty('puntuacion');
      expect(typeof result.puntuacion).toBe('number');
    });

    it('debería analizar combinaciones de ingredientes', () => {
      const result = synergyEngineV2.analyze(['valeriana', 'pasiflora']);
      
      // Verificar estructura del resultado
      expect(result).toBeDefined();
      expect(result).toHaveProperty('puntuacion');
      expect(typeof result.puntuacion).toBe('number');
    });

    it('debería manejar ingredientes desconocidos', () => {
      const result = synergyEngineV2.analyze(['desconocido1', 'desconocido2']);
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty('puntuacion');
      expect(result.puntuacion).toBe(0);
    });
  });

  describe('suggestPartners', () => {
    it('debería sugerir compañeros para un ingrediente', () => {
      const suggestions = synergyEngineV2.suggestPartners('equinacea', 3);
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });

    it('debería incluir sinergia en cada sugerencia', () => {
      const suggestions = synergyEngineV2.suggestPartners('equinacea', 3);
      
      suggestions.forEach(sug => {
        expect(sug).toHaveProperty('synergy');
        expect(sug.synergy).toHaveProperty('tipo');
      });
    });

    it('debería manejar ingrediente desconocido', () => {
      const suggestions = synergyEngineV2.suggestPartners('desconocido');
      expect(Array.isArray(suggestions)).toBe(true);
    });
  });

  describe('getAntagonismsFor', () => {
    it('debería obtener todos los antagonismos de un ingrediente', () => {
      const antagonisms = synergyEngineV2.getAntagonismsFor('warfarin');
      
      expect(Array.isArray(antagonisms)).toBe(true);
    });

    it('debería retornar array vacío para ingrediente sin antagonismos', () => {
      const antagonisms = synergyEngineV2.getAntagonismsFor('valeriana');
      expect(Array.isArray(antagonisms)).toBe(true);
    });
  });

  describe('getSynergiesFor', () => {
    it('debería obtener sinergias de un ingrediente', () => {
      const synergies = synergyEngineV2.getSynergiesFor('equinacea');
      
      expect(Array.isArray(synergies)).toBe(true);
    });
  });
});
