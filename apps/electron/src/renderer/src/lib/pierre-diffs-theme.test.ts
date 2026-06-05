import { describe, expect, it } from 'vitest';
import { getDiffsTheme } from './pierre-diffs-theme';

describe('getDiffsTheme', () => {
  it('maps dark to pierre-dark', () => {
    expect(getDiffsTheme('dark')).toBe('pierre-dark');
  });

  it('maps light to pierre-light', () => {
    expect(getDiffsTheme('light')).toBe('pierre-light');
  });
});
