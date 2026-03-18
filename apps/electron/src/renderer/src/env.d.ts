/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

import type { ElectronAPI } from '@electron-toolkit/preload';
import type { SqlProAPI } from '../../preload/index';

declare global {
  interface Window {
    sqlPro: SqlProAPI;
    electronAPI: ElectronAPI;
  }
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

// Extend Vitest matchers
declare module 'vitest' {
  interface CustomMatchers<R = unknown> {
    toBeInTheDocument: () => R;
    toBeDisabled: () => R;
    toBeEnabled: () => R;
    toBeEmptyDOMElement: () => R;
    toBeVisible: () => R;
    toHaveTextContent: (text: string | RegExp) => R;
    toHaveAttribute: (attr: string, value?: string) => R;
    toHaveClass: (...classNames: string[]) => R;
    toHaveStyle: (style: Record<string, unknown>) => R;
    toHaveFocus: () => R;
    toBeChecked: () => R;
    toBePartiallyChecked: () => R;
    toHaveValue: (value?: string | string[] | number | null) => R;
    toHaveDisplayValue: (value?: string | string[] | RegExp) => R;
    toBeInvalid: () => R;
    toBeValid: () => R;
    toBeRequired: () => R;
    toContainElement: (element: HTMLElement | null) => R;
    toContainHTML: (html: string) => R;
    toHaveDescription: (text?: string | RegExp) => R;
    toHaveErrorMessage: (text?: string | RegExp) => R;
    toHaveAccessibleName: (text?: string | RegExp) => R;
    toHaveAccessibleDescription: (text?: string | RegExp) => R;
  }

  interface Assertion<T = unknown> extends CustomMatchers<T> {}

  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
