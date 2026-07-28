/**
 * Tests para la utilidad cn (classnames)
 */

import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base active');
  });

  it('should handle false conditional classes', () => {
    const isActive = false;
    const result = cn('base', isActive && 'active');
    expect(result).toBe('base');
  });

  it('should merge conflicting tailwind classes', () => {
    const result = cn('p-2 p-4');
    expect(result).toBe('p-4');
  });

  it('should handle undefined values', () => {
    const result = cn('base', undefined, 'end');
    expect(result).toBe('base end');
  });

  it('should handle null values', () => {
    const result = cn('base', null, 'end');
    expect(result).toBe('base end');
  });

  it('should handle array inputs', () => {
    const result = cn(['foo', 'bar']);
    expect(result).toBe('foo bar');
  });

  it('should handle object inputs', () => {
    const result = cn({
      'foo': true,
      'bar': false,
      'baz': true,
    });
    expect(result).toBe('foo baz');
  });

  it('should handle mixed inputs', () => {
    const isActive = true;
    const result = cn(
      'base',
      ['array1', 'array2'],
      { active: isActive, disabled: false },
      'tail'
    );
    expect(result).toBe('base array1 array2 active tail');
  });
});
