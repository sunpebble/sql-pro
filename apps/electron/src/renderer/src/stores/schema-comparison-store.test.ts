import { beforeEach, describe, expect, it } from 'vitest';
import { useSchemaComparisonStore } from './schema-comparison-store';

describe('schema-comparison-store viewMode', () => {
  beforeEach(() => {
    useSchemaComparisonStore.getState().reset();
  });

  it('defaults to structured', () => {
    expect(useSchemaComparisonStore.getState().viewMode).toBe('structured');
  });

  it('setViewMode switches to sql', () => {
    useSchemaComparisonStore.getState().setViewMode('sql');
    expect(useSchemaComparisonStore.getState().viewMode).toBe('sql');
  });
});
