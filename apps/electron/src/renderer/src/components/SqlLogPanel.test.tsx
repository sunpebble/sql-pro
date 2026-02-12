import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@sqlpro/ui/tooltip';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SqlLogPanel } from './SqlLogPanel';
import { useSqlLogStore } from '@/stores/sql-log-store';

// Mock dependencies
vi.mock('@/stores/sql-log-store', () => ({
  useSqlLogStore: vi.fn(),
  initSqlLogListener: vi.fn(),
  cleanupSqlLogListener: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock ResizeObserver for ScrollArea/Radix
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as any;

describe('SqlLogPanel', () => {
  const mockStore = {
    logs: [],
    isLoading: false,
    filter: {},
    isVisible: true,
    isPaused: false,
    loadLogs: vi.fn(),
    clearLogs: vi.fn(),
    setFilter: vi.fn(),
    setVisible: vi.fn(),
    togglePaused: vi.fn(),
    getFilteredLogs: vi.fn().mockReturnValue([]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useSqlLogStore as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockStore);
  });

  it('renders with accessibility attributes', () => {
    render(
      <TooltipProvider>
        <SqlLogPanel />
      </TooltipProvider>
    );

    // Check close button aria-label
    // t('actions.close') -> 'actions.close'
    const closeButton = screen.getByLabelText('actions.close');
    expect(closeButton).toBeInTheDocument();

    // Check search input aria-label
    // t('sqlLog.searchPlaceholder') -> 'sqlLog.searchPlaceholder'
    const searchInput = screen.getByLabelText('sqlLog.searchPlaceholder');
    expect(searchInput).toBeInTheDocument();

    // Check select trigger aria-label
    // t('sqlLog.level') -> 'sqlLog.level'
    const selectTrigger = screen.getByLabelText('sqlLog.level');
    expect(selectTrigger).toBeInTheDocument();
  });
});
