## 2025-05-15 - [Electron Accessibility Testing]
**Learning:** Testing React components in this Electron app requires extensive mocking of Zustand stores and UI components. Specifically, `lucide-react` icons should be mocked to ensure tests don't fail on missing exports if using `vi.mock` with an explicit list.
**Action:** Use a comprehensive mock for `lucide-react` or `importOriginal` when possible. Always provide `defaultValue` in `t()` for easier testing.
