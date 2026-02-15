import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toolbar } from './Toolbar';

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => options?.defaultValue || key,
  }),
}));

vi.mock('@/stores/connection-store', () => ({
  useConnectionStore: () => ({
    connection: { id: 'test-id' }, // Toolbar needs a connection to render
  }),
}));

vi.mock('@/stores/changes-store', () => ({
  useChangesStore: () => ({
    hasChanges: () => false,
    changes: [],
  }),
}));

vi.mock('@/stores/dialog-store', () => ({
  useDialogStore: () => ({
    openChangesPanel: vi.fn(),
    agentSidebarOpen: false,
    toggleAgentSidebar: vi.fn(),
  }),
}));

vi.mock('@/stores/onboarding-store', () => ({
  useOnboardingStore: () => ({
    startTour: vi.fn(),
  }),
}));

describe('Toolbar', () => {
  it('should render AI Agent button with aria-label', () => {
    render(<Toolbar />);
    const aiButton = screen.getByLabelText('AI Agent');
    expect(aiButton).toBeInTheDocument();
  });

  it('should render Help button with aria-label', () => {
    render(<Toolbar />);
    const helpButton = screen.getByLabelText('Help');
    expect(helpButton).toBeInTheDocument();
  });
});
