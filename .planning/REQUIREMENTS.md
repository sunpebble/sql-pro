# Requirements: SQL Pro Design Refresh

**Defined:** 2026-01-26
**Core Value:** Visual and interaction experience at Linear/Raycast level of polish

## v1 Requirements

### Design Foundation (Foundation)

- [x] **FOUND-01**: Dark-first design system (dark mode as default CSS variables)
- [x] **FOUND-02**: OKLCH color system migration with Slate neutral palette
- [x] **FOUND-03**: Orange accent color tuned for dark background vibrancy
- [x] **FOUND-04**: Border radius reduced from 20px+ to 8-12px
- [x] **FOUND-05**: Subtle transparent borders (6-10% opacity)
- [x] **FOUND-06**: Dark mode shadow system (minimal, appropriate)

### Interaction System (Interaction)

- [x] **INTR-01**: Command palette (Cmd+K) with Linear-style visual treatment
- [x] **INTR-02**: Contextual commands based on current view
- [x] **INTR-03**: Keyboard shortcuts displayed inline with menu items
- [x] **INTR-04**: Standardized transitions (100-200ms + ease-out)
- [x] **INTR-05**: Focus rings only on keyboard navigation (:focus-visible)

### Visual Polish (Visual)

- [x] **VISL-01**: Three-level text hierarchy (primary/secondary/muted)
- [x] **VISL-02**: Simplified button design (less decoration)
- [x] **VISL-03**: Refined input/form styling for dark mode
- [x] **VISL-04**: Glassmorphism on dialogs (backdrop-filter: blur)
- [x] **VISL-05**: Subtle hover states (background change, no lift)
- [x] **VISL-06**: Minimal loading/skeleton states
- [x] **VISL-07**: High-contrast table view for dark mode

### App Navigation (Navigation)

- [x] **NAVI-01**: Flattened sidebar visual (reduced nesting decoration)
- [x] **NAVI-02**: Pill-style tab bar (background highlight, not underline)
- [x] **NAVI-03**: Icon-only Activity Bar (minimal, no labels)

### Monaco Editor (Editor)

- [x] **EDIT-01**: SQL editor theme coordinated with design system
- [x] **EDIT-02**: Editor cursor and selection with orange accent

### Website (Website)

- [ ] **WEB-01**: Simplified Hero with prominent product screenshot
- [ ] **WEB-02**: Concise marketing copy (core value focus)
- [ ] **WEB-03**: Embedded product demo (video/animation)
- [ ] **WEB-04**: Bento grid Features layout
- [ ] **WEB-05**: Scroll-triggered fade-up animations
- [ ] **WEB-06**: Streamlined Download section
- [ ] **WEB-07**: Minimal Footer with essential links only
- [ ] **WEB-08**: Website colors unified with app dark theme

## v2 Requirements

### Interaction Enhancement

- **INTR-V2-01**: Vim-style list navigation (j/k)
- **INTR-V2-02**: Command history and recents
- **INTR-V2-03**: Keyboard shortcut learning hints

### Visual Enhancement

- **VISL-V2-01**: Gradient text for headlines
- **VISL-V2-02**: Noise texture overlay
- **VISL-V2-03**: Theme variants (Glass, etc.)
- **VISL-V2-04**: Performance-aware animation enhancement

### Website Enhancement

- **WEB-V2-01**: Interactive product demo
- **WEB-V2-02**: Dark/light theme toggle

## Out of Scope

| Feature                 | Reason                                    |
| ----------------------- | ----------------------------------------- |
| Mobile responsiveness   | Desktop app priority                      |
| New core features       | Design refresh only                       |
| Full design system docs | Implementation first                      |
| Light mode fine-tuning  | Dark-first, light mode just needs to work |

## Traceability

| Requirement | Phase    | Status   |
| ----------- | -------- | -------- |
| FOUND-01    | Phase 1  | Complete |
| FOUND-02    | Phase 1  | Complete |
| FOUND-03    | Phase 1  | Complete |
| FOUND-04    | Phase 1  | Complete |
| FOUND-05    | Phase 1  | Complete |
| FOUND-06    | Phase 1  | Complete |
| VISL-01     | Phase 2  | Complete |
| NAVI-01     | Phase 3  | Complete |
| NAVI-02     | Phase 3  | Complete |
| NAVI-03     | Phase 3  | Complete |
| VISL-02     | Phase 4  | Complete |
| VISL-03     | Phase 4  | Complete |
| INTR-01     | Phase 5  | Complete |
| INTR-02     | Phase 5  | Complete |
| INTR-03     | Phase 5  | Complete |
| INTR-04     | Phase 5  | Complete |
| INTR-05     | Phase 5  | Complete |
| VISL-04     | Phase 6  | Complete |
| VISL-05     | Phase 6  | Complete |
| VISL-06     | Phase 6  | Complete |
| VISL-07     | Phase 7  | Complete |
| EDIT-01     | Phase 8  | Complete |
| EDIT-02     | Phase 8  | Complete |
| WEB-08      | Phase 9  | Pending  |
| WEB-01      | Phase 10 | Pending  |
| WEB-02      | Phase 10 | Pending  |
| WEB-03      | Phase 10 | Pending  |
| WEB-04      | Phase 10 | Pending  |
| WEB-06      | Phase 10 | Pending  |
| WEB-07      | Phase 10 | Pending  |
| WEB-05      | Phase 11 | Pending  |

**Coverage:**

- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---

_Requirements defined: 2026-01-26_
_Traceability updated: 2026-01-26 after roadmap creation_
