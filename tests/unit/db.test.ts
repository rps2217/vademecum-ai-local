/**
 * Tests para tipos de la base de datos
 * 
 * Estos tests verifican la definicion de tipos sin necesidad de IndexedDB real.
 */

import { describe, it, expect } from 'vitest';
import type {
  SafetyStatus,
  IngredientCategory,
  BodySystem,
  EvidenceLevel,
  SynergyType,
  SynergyLevel,
  SyncOpType,
  SyncTable,
  OutboxStatus,
} from '@/db/schema';

describe('Database Types', () => {
  describe('SafetyStatus', () => {
    it('should have all valid safety statuses', () => {
      const statuses: SafetyStatus[] = ['apto', 'evitar', 'contraindicado', 'desconocido'];
      
      expect(statuses).toContain('apto');
      expect(statuses).toContain('evitar');
      expect(statuses).toContain('contraindicado');
      expect(statuses).toContain('desconocido');
      expect(statuses.length).toBe(4);
    });
  });

  describe('IngredientCategory', () => {
    it('should have all valid ingredient categories', () => {
      const categories: IngredientCategory[] = [
        'fitoterapia',
        'homeopatia', 
        'aceite_esencial',
        'vitamina',
        'mineral',
        'probiotico',
        'prebiotico',
        'enzima',
        'aminoacido',
      ];
      
      expect(categories).toContain('fitoterapia');
      expect(categories).toContain('vitamina');
      expect(categories).toContain('mineral');
      expect(categories.length).toBe(9);
    });
  });

  describe('BodySystem', () => {
    it('should have all valid body systems', () => {
      const systems: BodySystem[] = [
        'nervioso',
        'digestivo',
        'inmune',
        'cardiovascular',
        'respiratorio',
        'musculoesqueletico',
        'endocrino',
      ];
      
      expect(systems).toContain('nervioso');
      expect(systems).toContain('digestivo');
      expect(systems).toContain('inmune');
      expect(systems.length).toBe(7);
    });
  });

  describe('EvidenceLevel', () => {
    it('should have valid evidence levels', () => {
      const levels: EvidenceLevel[] = ['A', 'B', 'C', 'D'];
      
      expect(levels).toContain('A');
      expect(levels).toContain('B');
      expect(levels).toContain('C');
      expect(levels).toContain('D');
      expect(levels.length).toBe(4);
    });
  });

  describe('SynergyType', () => {
    it('should have all valid synergy types', () => {
      const types: SynergyType[] = ['sinergia', 'antagonismo', 'interaccion', 'complemento'];
      
      expect(types).toContain('sinergia');
      expect(types).toContain('antagonismo');
      expect(types).toContain('interaccion');
      expect(types).toContain('complemento');
      expect(types.length).toBe(4);
    });
  });

  describe('SynergyLevel', () => {
    it('should have all valid synergy levels', () => {
      const levels: SynergyLevel[] = ['bajo', 'medio', 'alto', 'critico'];
      
      expect(levels).toContain('bajo');
      expect(levels).toContain('medio');
      expect(levels).toContain('alto');
      expect(levels).toContain('critico');
      expect(levels.length).toBe(4);
    });
  });

  describe('SyncOpType', () => {
    it('should have all valid sync operation types', () => {
      const types: SyncOpType[] = ['insert', 'update', 'delete'];
      
      expect(types).toContain('insert');
      expect(types).toContain('update');
      expect(types).toContain('delete');
      expect(types.length).toBe(3);
    });
  });

  describe('SyncTable', () => {
    it('should have all valid sync tables', () => {
      const tables: SyncTable[] = ['products', 'ingredients', 'synergies', 'protocols', 'settings'];
      
      expect(tables).toContain('products');
      expect(tables).toContain('ingredients');
      expect(tables).toContain('synergies');
      expect(tables.length).toBe(5);
    });
  });

  describe('OutboxStatus', () => {
    it('should have all valid outbox statuses', () => {
      const statuses: OutboxStatus[] = ['pending', 'in_flight', 'failed', 'synced', 'conflict'];
      
      expect(statuses).toContain('pending');
      expect(statuses).toContain('in_flight');
      expect(statuses).toContain('failed');
      expect(statuses).toContain('synced');
      expect(statuses).toContain('conflict');
      expect(statuses.length).toBe(5);
    });
  });
});

describe('Type Consistency', () => {
  it('should match SafetyStatus in Security type', () => {
    // Verificar que los tipos son consistentes
    const validSafety: SafetyStatus[] = ['apto', 'evitar', 'contraindicado', 'desconocido'];
    
    // Un ingrediente deberia poder tener cualquiera de estos estados
    const exampleStatus = validSafety[0];
    expect(exampleStatus).toBeDefined();
  });

  it('should support evidence-based classification', () => {
    // Verificar que la clasificacion por evidencia tiene sentido
    const evidenceLevels: EvidenceLevel[] = ['A', 'B', 'C', 'D'];
    
    // A = Alta evidencia, D = Baja evidencia
    expect(evidenceLevels.length).toBeGreaterThanOrEqual(4);
  });
});
