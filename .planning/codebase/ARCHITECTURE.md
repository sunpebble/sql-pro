# Architecture

**Analysis Date:** 2026-01-25

## Pattern Overview

**Overall:** Monorepo with distinct application and package separation. The project utilizes a component-based architecture for its user interfaces and a client-server model for the Electron desktop application.

**Key Characteristics:**

- **Monorepo:** Organizes multiple projects (Electron app, website, shared packages) within a single repository.
- **Client-Server (Electron):** The `electron` app separates the main process (backend/system interaction) from the renderer process (frontend UI).
- **Component-Based UI:** Both the Electron renderer and the website leverage React for modular and reusable UI components.
- **Shared Packages:** Common functionalities and UI components are extracted into `packages/` for reuse across applications.

## Layers

**Electron Main Process:**

- Purpose: Handles native OS interactions, manages windows, and provides backend services for the renderer process via Inter-Process Communication (IPC).
- Location: `apps/electron/src/main/`
- Contains: Electron main entry point, IPC handlers, background services.
- Depends on: Node.js APIs, Electron APIs.
- Used by: Electron Renderer Process.

**Electron Renderer Process (Frontend):**

- Purpose: Renders the user interface for the desktop application using React. Communicates with the Electron Main Process for system-level operations.
- Location: `apps/electron/src/renderer/`
- Contains: React components, hooks, styling, routing, and UI logic.
- Depends on: React, shared UI components from `packages/ui`, Electron Main Process (via IPC).
- Used by: End-user (desktop application).

**Website (Frontend):**

- Purpose: Serves as the marketing website for SQL Pro, built with React.
- Location: `apps/website/`
- Contains: React components, styling, routing, and static content.
- Depends on: React, shared UI components from `packages/ui`.
- Used by: Web visitors.

**Shared UI Package:**

- Purpose: Provides reusable UI components (e.g., shadcn/ui based components) that can be shared between the Electron renderer and the website.
- Location: `packages/ui/`
- Contains: Generic React UI components, utility components.
- Depends on: React, Tailwind CSS, shadcn/ui.
- Used by: Electron Renderer Process, Website.

**License API Package:**

- Purpose: Handles license-related logic and API interactions, likely for product activation or feature unlocking.
- Location: `packages/license-api/`
- Contains: API client code, licensing logic, data models.
- Depends on: External licensing services, potentially Node.js for server-side logic.
- Used by: Potentially both Electron Main/Renderer, or a separate backend service.

## Data Flow

**Electron Application:**

1. **User Interaction:** User interacts with the UI in the Renderer Process (`apps/electron/src/renderer/`).
2. **IPC Request:** If a system-level operation is required (e.g., file access, database connection), the Renderer Process sends an IPC message to the Main Process.
3. **Main Process Handling:** The Main Process (`apps/electron/src/main/`) receives the IPC message, performs the necessary operation (e.g., database query, file I/O), and potentially processes data.
4. **IPC Response:** The Main Process sends an IPC response back to the Renderer Process with results or status.
5. **UI Update:** The Renderer Process updates the UI based on the response.

**Website:**

1. **User Interaction:** User interacts with the UI in `apps/website/`.
2. **API Call:** Frontend makes API calls to backend services (potentially including `packages/license-api`).
3. **UI Update:** Frontend updates UI based on API responses.

**State Management:**

- Application state is likely managed within React components and context, potentially with a global state management library for more complex states in the Electron renderer.

## Key Abstractions

**React Components:**

- Purpose: Encapsulate UI logic and rendering, promoting reusability and maintainability.
- Examples: `apps/electron/src/renderer/src/components/`, `apps/website/src/components/`, `packages/ui/src/`.
- Pattern: Functional components with hooks.

**Electron IPC:**

- Purpose: Facilitate communication between the main and renderer processes in the Electron application.
- Examples: Handlers in `apps/electron/src/main/` and IPC calls in `apps/electron/src/renderer/`.
- Pattern: `ipcMain.handle` and `ipcRenderer.invoke`.

## Entry Points

**Electron Main Process:**

- Location: `apps/electron/src/main/index.ts`
- Triggers: Electron application startup.
- Responsibilities: Window creation, IPC registration, main process logic, application lifecycle management.

**Electron Renderer Process:**

- Location: `apps/electron/src/renderer/src/main.tsx`
- Triggers: Renderer process initialization.
- Responsibilities: React application bootstrapping, UI rendering, client-side routing.

**Website:**

- Location: `apps/website/src/main.tsx`
- Triggers: Web page load.
- Responsibilities: React application bootstrapping, UI rendering, client-side routing.

## Error Handling

**Strategy:** Error handling likely involves a combination of try-catch blocks in asynchronous operations, error boundaries in React for UI errors, and potentially centralized error logging mechanisms.

**Patterns:**

- IPC Error Propagation: Errors in the main process are caught and returned to the renderer process via IPC messages.
- UI Error Boundaries: React Error Boundaries are likely used to gracefully handle rendering errors.

## Cross-Cutting Concerns

**Logging:** Likely uses `console.log` for development and potentially a more robust logging solution for production builds of the Electron app.
**Validation:** Input validation is performed both on the frontend (React forms) and potentially on the backend (Electron main process for critical operations).
**Authentication:** Not explicitly detailed in the structure, but would typically involve dedicated services or modules for user authentication and authorization, especially for features like license management.

---

_Architecture analysis: 2026-01-25_
