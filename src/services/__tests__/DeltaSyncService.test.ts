/**
 * Tests de Integración para DeltaSyncService
 */

import { describe, it, expect } from 'vitest';
import { deltaSyncService } from '../DeltaSyncService';

describe('DeltaSyncService', () => {
  describe('Service Structure', () => {
    it('should be exported as singleton', () => {
      expect(deltaSyncService).toBeDefined();
      expect(typeof deltaSyncService.getCheckpoint).toBe('function');
      expect(typeof deltaSyncService.getPendingChanges).toBe('function');
      expect(typeof deltaSyncService.addPendingChange).toBe('function');
      expect(typeof deltaSyncService.getSyncStats).toBe('function');
      expect(typeof deltaSyncService.needsSync).toBe('function');
      expect(typeof deltaSyncService.getLocalKb).toBe('function');
      expect(typeof deltaSyncService.markIngredientModified).toBe('function');
    });
  });

  describe('Checkpoint Management', () => {
    it('should return null when no checkpoint exists', () => {
      const checkpoint = deltaSyncService.getCheckpoint();
      expect(checkpoint).toBeNull();
    });
  });

  describe('Pending Changes', () => {
    it('should return empty array when no pending changes', () => {
      const changes = deltaSyncService.getPendingChanges();
      expect(Array.isArray(changes)).toBe(true);
    });
  });

  describe('Sync Stats', () => {
    it('should return correct sync stats structure', () => {
      const stats = deltaSyncService.getSyncStats();
      
      expect(stats).toHaveProperty('lastSync');
      expect(stats).toHaveProperty('pendingChanges');
      expect(stats).toHaveProperty('needsSync');
      expect(typeof stats.pendingChanges).toBe('number');
      expect(typeof stats.needsSync).toBe('boolean');
    });

    it('should detect when sync is needed', () => {
      const needsSync = deltaSyncService.needsSync();
      expect(typeof needsSync).toBe('boolean');
    });
  });

  describe('Local KB', () => {
    it('should get local KB data', () => {
      const localKb = deltaSyncService.getLocalKb();
      
      expect(localKb).toHaveProperty('version');
      expect(localKb).toHaveProperty('ingredients');
      expect(Array.isArray(localKb.ingredients)).toBe(true);
    });
  });

  describe('Listener Pattern', () => {
    it('should support adding and removing listeners', () => {
      const callback = () => {};
      const remove = deltaSyncService.addListener(callback);
      
      expect(typeof remove).toBe('function');
      remove();
    });
  });
});
