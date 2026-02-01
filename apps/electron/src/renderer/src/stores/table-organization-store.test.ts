import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useTableOrganizationStore } from './table-organization-store';

describe('useTableOrganizationStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useTableOrganizationStore.setState({
      sortOption: 'name-asc',
      tags: [],
      tableMetadata: {},
      activeTagFilter: null,
    });
  });

  describe('sort options', () => {
    it('should initialize with name-asc sort option', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      expect(result.current.sortOption).toBe('name-asc');
    });

    it('should change sort option', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        result.current.setSortOption('row-count-desc');
      });
      expect(result.current.sortOption).toBe('row-count-desc');
    });
  });

  describe('tag management', () => {
    it('should add a new tag', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        result.current.addTag('important');
      });
      const tagNames = result.current.tags.map((t) => t.name);
      expect(tagNames).toContain('important');
    });

    it('should not add duplicate tags', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        result.current.addTag('important');
        result.current.addTag('important');
      });
      const tagNames = result.current.tags.filter(
        (t) => t.name === 'important'
      );
      expect(tagNames.length).toBe(1);
    });

    it('should remove a tag', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        result.current.addTag('toremove');
      });
      const tagNames1 = result.current.tags.map((t) => t.name);
      expect(tagNames1).toContain('toremove');
      act(() => {
        result.current.removeTag('toremove');
      });
      const tagNames2 = result.current.tags.map((t) => t.name);
      expect(tagNames2).not.toContain('toremove');
    });

    it('should rename a tag', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        result.current.addTag('oldname');
      });
      act(() => {
        result.current.renameTag('oldname', 'newname');
      });
      const tagNames = result.current.tags.map((t) => t.name);
      expect(tagNames).not.toContain('oldname');
      expect(tagNames).toContain('newname');
    });
  });

  describe('table metadata', () => {
    const tableKey = 'test.db:main:users';

    it('should add a tag to a table', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        result.current.addTableTag(tableKey, 'important');
      });
      const metadata = result.current.getTableMetadata(tableKey);
      // The tag should be created and associated with the table
      const tag = result.current.tags.find((t) => t.name === 'important');
      expect(tag).toBeDefined();
      expect(metadata.tagIds).toContain(tag?.id);
    });

    it('should remove a tag from a table', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        result.current.addTableTag(tableKey, 'toremove');
      });
      const tag = result.current.tags.find((t) => t.name === 'toremove');
      act(() => {
        result.current.removeTableTag(tableKey, 'toremove');
      });
      const metadata = result.current.getTableMetadata(tableKey);
      expect(metadata.tagIds).not.toContain(tag?.id);
    });

    it('should set table as pinned', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        result.current.setTablePinned(tableKey, true);
      });
      const metadata = result.current.getTableMetadata(tableKey);
      expect(metadata.pinned).toBe(true);
    });

    it('should unpin a table', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        result.current.setTablePinned(tableKey, true);
      });
      act(() => {
        result.current.setTablePinned(tableKey, false);
      });
      const metadata = result.current.getTableMetadata(tableKey);
      expect(metadata.pinned).toBe(false);
    });
  });

  describe('tag filter', () => {
    it('should set active tag filter', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        const tagId = result.current.createTag('filterme');
        result.current.setActiveTagFilter(tagId);
      });
      expect(result.current.activeTagFilter).not.toBeNull();
    });

    it('should clear active tag filter', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      act(() => {
        const tagId = result.current.createTag('filterme');
        result.current.setActiveTagFilter(tagId);
      });
      act(() => {
        result.current.setActiveTagFilter(null);
      });
      expect(result.current.activeTagFilter).toBeNull();
    });
  });

  describe('getTableKey', () => {
    it('should generate correct table key', () => {
      const { result } = renderHook(() => useTableOrganizationStore());
      const key = result.current.getTableKey(
        '/path/to/db.sqlite',
        'main',
        'users'
      );
      expect(key).toBe('/path/to/db.sqlite:main:users');
    });
  });
});
