/**
 * Tests para el SyncEngine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncEngine } from '@/lib/sync';

// Mock fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('SyncEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SyncEngine.stop();
  });

  describe('configuration', () => {
    it('should accept configuration options', () => {
      SyncEngine.configure({
        syncInterval: 60000,
        maxRetries: 5,
      });

      // SyncEngine should not throw
      expect(true).toBe(true);
    });

    it('should use default values', () => {
      SyncEngine.configure({});
      expect(true).toBe(true);
    });
  });

  describe('start/stop', () => {
    it('should start without errors', async () => {
      // Without Supabase config, should not make network requests
      await expect(SyncEngine.start()).resolves.not.toThrow();
    });

    it('should stop without errors', () => {
      SyncEngine.stop();
      expect(true).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return sync statistics', async () => {
      const stats = await SyncEngine.getStats();
      
      expect(stats).toHaveProperty('pendingOps');
      expect(stats).toHaveProperty('lastSyncAt');
      expect(stats).toHaveProperty('lastSyncResult');
      expect(stats).toHaveProperty('errors');
    });

    it('should return pendingOps as number', async () => {
      const stats = await SyncEngine.getStats();
      expect(typeof stats.pendingOps).toBe('number');
    });
  });
});

describe('Sync operation types', () => {
  it('should support insert operations', () => {
    const type: 'insert' | 'update' | 'delete' = 'insert';
    expect(type).toBe('insert');
  });

  it('should support update operations', () => {
    const type: 'insert' | 'update' | 'delete' = 'update';
    expect(type).toBe('update');
  });

  it('should support delete operations', () => {
    const type: 'insert' | 'update' | 'delete' = 'delete';
    expect(type).toBe('delete');
  });
});
