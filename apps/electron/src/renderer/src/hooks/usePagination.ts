import { useCallback, useMemo, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface UsePaginationOptions {
  /** Total number of items to paginate */
  totalItems: number;
  /** Initial page size (default: 50) */
  initialPageSize?: number;
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Callback when page changes */
  onPageChange?: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange?: (pageSize: number) => void;
}

export interface UsePaginationResult<T = unknown> {
  /** Current page number (1-indexed) */
  page: number;
  /** Current page size */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there is a next page */
  hasNext: boolean;
  /** Whether there is a previous page */
  hasPrev: boolean;
  /** Start index of current page (0-indexed) */
  startIndex: number;
  /** End index of current page (exclusive, 0-indexed) */
  endIndex: number;
  /** Number of items on current page */
  currentPageSize: number;

  // Navigation functions
  /** Go to next page */
  nextPage: () => void;
  /** Go to previous page */
  prevPage: () => void;
  /** Go to a specific page */
  goToPage: (page: number) => void;
  /** Go to first page */
  goToFirstPage: () => void;
  /** Go to last page */
  goToLastPage: () => void;
  /** Set page size (resets to page 1) */
  setPageSize: (size: number) => void;

  // Data slicing
  /** Get items for current page from an array */
  getPageItems: <I = T>(items: I[]) => I[];

  // Reset
  /** Reset pagination to initial state */
  reset: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * A reusable pagination hook that manages page state, navigation,
 * and data slicing for paginated views.
 */
export function usePagination<T = unknown>(
  options: UsePaginationOptions
): UsePaginationResult<T> {
  const {
    totalItems,
    initialPageSize = 50,
    initialPage = 1,
    onPageChange,
    onPageSizeChange,
  } = options;

  // Local state
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  // Computed values
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  );

  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const startIndex = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  const endIndex = useMemo(
    () => Math.min(startIndex + pageSize, totalItems),
    [startIndex, pageSize, totalItems]
  );

  const currentPageSize = endIndex - startIndex;

  // Update page
  const updatePage = useCallback(
    (newPage: number) => {
      const clampedPage = Math.max(1, Math.min(newPage, totalPages));
      setPage(clampedPage);
      onPageChange?.(clampedPage);
    },
    [totalPages, onPageChange]
  );

  // Update page size (resets to page 1)
  const updatePageSize = useCallback(
    (newSize: number) => {
      const validSize = Math.max(1, newSize);
      setPageSizeState(validSize);
      setPage(1);
      onPageSizeChange?.(validSize);
      onPageChange?.(1);
    },
    [onPageSizeChange, onPageChange]
  );

  // Navigation functions
  const nextPage = useCallback(() => {
    if (hasNext) {
      updatePage(page + 1);
    }
  }, [hasNext, page, updatePage]);

  const prevPage = useCallback(() => {
    if (hasPrev) {
      updatePage(page - 1);
    }
  }, [hasPrev, page, updatePage]);

  const goToPage = useCallback(
    (targetPage: number) => {
      updatePage(targetPage);
    },
    [updatePage]
  );

  const goToFirstPage = useCallback(() => {
    updatePage(1);
  }, [updatePage]);

  const goToLastPage = useCallback(() => {
    updatePage(totalPages);
  }, [updatePage, totalPages]);

  const setPageSize = useCallback(
    (size: number) => {
      updatePageSize(size);
    },
    [updatePageSize]
  );

  // Get items for current page
  const getPageItems = useCallback(
    <I = T>(items: I[]): I[] => {
      return items.slice(startIndex, endIndex);
    },
    [startIndex, endIndex]
  );

  // Reset to initial state
  const reset = useCallback(() => {
    setPage(initialPage);
    setPageSizeState(initialPageSize);
    onPageChange?.(initialPage);
    onPageSizeChange?.(initialPageSize);
  }, [initialPage, initialPageSize, onPageChange, onPageSizeChange]);

  return {
    // State
    page,
    pageSize,
    totalItems,
    totalPages,
    hasNext,
    hasPrev,
    startIndex,
    endIndex,
    currentPageSize,

    // Navigation
    nextPage,
    prevPage,
    goToPage,
    goToFirstPage,
    goToLastPage,
    setPageSize,

    // Data slicing
    getPageItems,

    // Reset
    reset,
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Props for pagination UI components
 */
export interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNextPage: () => void;
  onPrevPage: () => void;
  onGoToPage: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  pageSizeOptions?: number[];
}

/**
 * Extract pagination controls props from usePagination result
 */
export function getPaginationControlsProps(
  pagination: UsePaginationResult,
  options?: { isLoading?: boolean; pageSizeOptions?: number[] }
): PaginationControlsProps {
  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    hasNext: pagination.hasNext,
    hasPrev: pagination.hasPrev,
    onNextPage: pagination.nextPage,
    onPrevPage: pagination.prevPage,
    onGoToPage: pagination.goToPage,
    onPageSizeChange: pagination.setPageSize,
    isLoading: options?.isLoading,
    pageSizeOptions: options?.pageSizeOptions,
  };
}
