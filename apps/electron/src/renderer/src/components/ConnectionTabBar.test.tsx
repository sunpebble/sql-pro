import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConnectionTabBar } from './ConnectionTabBar';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
        if (options?.defaultValue) return options.defaultValue.replace('{{color}}', options.color || '');
        return key;
    },
  }),
}));

vi.mock('@/stores/connection-store', () => ({
  useConnectionStore: () => ({
    activeConnectionId: 'conn-1',
    connectionTabOrder: ['conn-1'],
    getAllConnections: () => [
      {
        id: 'conn-1',
        filename: 'test.db',
        path: '/path/to/test.db',
        status: 'connected',
      },
    ],
    setActiveConnection: vi.fn(),
    removeConnection: vi.fn(),
    reorderConnections: vi.fn(),
    setSelectedTable: vi.fn(),
    getConnectionColor: () => 'blue',
    setConnectionColor: vi.fn(),
    setSchema: vi.fn(),
  }),
}));

vi.mock('@/stores/changes-store', () => ({
  useChangesStore: () => ({
    hasChangesForConnection: () => false,
    getChangesForConnection: () => [],
    clearChangesForConnection: () => {},
  }),
}));

vi.mock('@/stores/table-data-store', () => ({
  useTableDataStore: () => ({
    resetConnection: vi.fn(),
  }),
}));

vi.mock('@/stores/dialog-store', () => ({
  useDialogStore: () => ({
    openConnectionSettings: vi.fn(),
    openChangePassword: vi.fn(),
    openBackupDialog: vi.fn(),
  }),
}));

vi.mock('@sqlpro/ui/context-menu', () => ({
    ContextMenu: ({ children }) => <div>{children}</div>,
    ContextMenuTrigger: ({ children }) => <div>{children}</div>,
    ContextMenuContent: ({ children }) => <div>{children}</div>,
    ContextMenuItem: ({ children }) => <div role="menuitem">{children}</div>,
    ContextMenuSeparator: () => <hr />,
    ContextMenuSub: ({ children }) => <div>{children}</div>,
    ContextMenuSubTrigger: ({ children }) => <div>{children}</div>,
    ContextMenuSubContent: ({ children }) => <div>{children}</div>,
}));

// Mock DndContext stuff
vi.mock('@dnd-kit/core', async () => {
    const actual = await vi.importActual('@dnd-kit/core');
    return {
        ...actual,
        DndContext: ({ children }) => <div>{children}</div>,
        useSensor: vi.fn(),
        useSensors: vi.fn(),
        KeyboardSensor: vi.fn(),
        PointerSensor: vi.fn(),
    };
});

vi.mock('@dnd-kit/sortable', () => ({
    SortableContext: ({ children }) => <div>{children}</div>,
    useSortable: () => ({
        attributes: {},
        listeners: {},
        setNodeRef: vi.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    }),
    horizontalListSortingStrategy: {},
    sortableKeyboardCoordinates: vi.fn(),
}));

describe('ConnectionTabBar', () => {
  it('should render Close Connection button with aria-label', () => {
    render(<ConnectionTabBar />);
    const closeButton = screen.getByLabelText('Close connection');
    expect(closeButton).toBeInTheDocument();
  });

  it('should render Color Selection buttons with aria-label', () => {
    render(<ConnectionTabBar />);
    const blueButton = screen.getByLabelText('Set color to Blue');
    expect(blueButton).toBeInTheDocument();
  });
});
