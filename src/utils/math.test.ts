import { describe, it, expect } from 'vitest';
import { cosineSimilarity } from './math';

describe('Math utilities', () => {
  describe('cosineSimilarity', () => {
    it('should return 1 for identical vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [1, 2, 3];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(1);
    });

    it('should return 0 for orthogonal vectors', () => {
      const vec1 = [1, 0];
      const vec2 = [0, 1];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(0);
    });

    it('should return -1 for opposite vectors', () => {
      const vec1 = [1, 2, 3];
      const vec2 = [-1, -2, -3];
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(-1);
    });

    it('should return 0 when one vector is zero', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [1, 2, 3];
      expect(cosineSimilarity(vec1, vec2)).toBe(0);
    });

    it('should calculate correct similarity for arbitrary vectors', () => {
      const vec1 = [1, 0, -1];
      const vec2 = [-1, -1, 0];
      // dot product = -1
      // mag1 = sqrt(2)
      // mag2 = sqrt(2)
      // cos = -1 / 2 = -0.5
      expect(cosineSimilarity(vec1, vec2)).toBeCloseTo(-0.5);
    });
  });
});
