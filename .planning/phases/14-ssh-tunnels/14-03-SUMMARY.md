---
phase: 14
plan: 03
subsystem: ssh-tunnels
tags: [ssh, tunnel, ipc, database-manager, ui-indicator]
requires: ['14-01', '14-02']
provides:
  [
    'SSH tunnel integration with database connections',
    'IPC handlers for SSH operations',
    'Tunnel status UI indicator',
  ]
affects: ['future connection management', 'remote database access']
tech-stack:
  added: []
  patterns:
    [
      'IPC bridge pattern',
      'polling for status updates',
      'zustand store extension',
    ]
key-files:
  created:
    - apps/electron/src/main/services/ipc/ssh.ts
    - apps/electron/src/renderer/src/components/ConnectionStatusIndicator.tsx
  modified:
    - apps/electron/src/main/services/ipc/index.ts
    - apps/electron/src/main/services/database-adapters/database-manager.ts
    - apps/electron/src/preload/index.ts
    - apps/electron/src/renderer/src/stores/connection-store.ts
    - apps/electron/src/renderer/src/locales/en/common.json
    - apps/electron/src/renderer/src/locales/zh/common.json
decisions:
  - id: tunnel-id-management
    choice: Recreate tunnel with actual connection ID after database connects
    rationale: Database adapters generate connection IDs, so we create temp tunnel first then recreate with proper ID
  - id: status-polling
    choice: Poll tunnel status every 5 seconds via IPC
    rationale: Simple and reliable approach that works across process boundaries
metrics:
  duration: ~25 minutes
  completed: 2026-01-30
---

# Phase 14 Plan 03: SSH Tunnel Integration Summary

SSH IPC handlers created, database manager integrated with tunnel creation, and UI status indicator component added.

## What Was Built

### 1. SSH IPC Handlers (`apps/electron/src/main/services/ipc/ssh.ts`)

- `ssh:save-credentials` - Save SSH credentials securely via safeStorage
- `ssh:has-credentials` - Check if credentials exist for a profile
- `ssh:get-credentials` - Retrieve decrypted credentials
- `ssh:remove-credentials` - Delete stored credentials
- `ssh:get-tunnel-status` - Get current tunnel status for a connection
- `ssh:close-tunnel` - Close a specific tunnel
- `ssh:test-connection` - Test SSH connection without persistent tunnel
- `ssh:has-tunnel` - Check if tunnel exists for connection

### 2. Database Manager Integration

Modified `DatabaseManager.open()` to:

- Check if SSH tunnel is enabled in connection config
- Retrieve credentials from secure storage or inline config
- Create SSH tunnel before database connection
- Route database traffic through `127.0.0.1:dynamicPort`
- Recreate tunnel with actual connection ID after successful connect
- Clean up tunnel on connection failure

Modified `DatabaseManager.close()` to:

- Close associated SSH tunnel when database connection closes

Modified `DatabaseManager.closeAll()` to:

- Close all SSH tunnels on application shutdown

### 3. Preload Bridge

Added `window.sqlPro.ssh` API with methods:

- `saveCredentials(profileId, credentials)`
- `hasCredentials(profileId)`
- `getCredentials(profileId)`
- `removeCredentials(profileId)`
- `getTunnelStatus(connectionId)`
- `closeTunnel(connectionId)`
- `testConnection(config, credentials)`
- `hasTunnel(connectionId)`

### 4. Connection Store Updates

- Added `TunnelStatus` type tracking tunnel state
- Added `tunnelStatuses` state (Record<connectionId, TunnelStatus>)
- Added actions: `setTunnelStatus`, `getTunnelStatus`, `pollTunnelStatus`, `stopPollingTunnelStatus`
- Polling mechanism using window intervals for cross-component cleanup

### 5. ConnectionStatusIndicator Component

- Visual indicator showing SSH tunnel status
- States: connected (green), connecting/reconnecting (orange), error (red), disconnected (gray)
- Tooltip with detailed status including local port and reconnect attempts
- Auto-starts polling on mount, stops on unmount
- Returns null if no tunnel (non-SSH connections)

### 6. i18n Strings

Added SSH-related translations in both en and zh locales:

- `ssh.tunnel`, `ssh.tunnelActive`, `ssh.tunnelConnecting`
- `ssh.tunnelReconnecting`, `ssh.tunnelError`, `ssh.tunnelDisconnected`
- `ssh.localPort`, `ssh.reconnectAttempts`

## Commits

| Commit   | Description                                                              |
| -------- | ------------------------------------------------------------------------ |
| 12ba813b | feat(14-03): add SSH IPC handlers and preload bridge                     |
| 2e3d9e9d | feat(14-03): integrate SSH tunnel creation into database connection flow |
| 1f7bb795 | feat(14-03): add tunnel status indicator and connection store updates    |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] TypeScript compiles without errors
- [x] App starts without errors
- [x] IPC handlers registered in main process
- [x] Preload bridge exposes SSH operations to renderer
- [x] Connection store tracks tunnel status
- [x] ConnectionStatusIndicator component created

## Next Steps

To display the SSH tunnel status in the UI:

1. Import `ConnectionStatusIndicator` in connection-related components
2. Pass the `connectionId` prop to show status for that connection
3. The component automatically handles polling and cleanup

Example usage:

```tsx
import { ConnectionStatusIndicator } from '@/components/ConnectionStatusIndicator';

// In a connection tab or header
<ConnectionStatusIndicator connectionId={connection.id} />;
```

## Success Criteria Verification

- [x] SSH tunnel is created before database connection when SSH is enabled
- [x] Database traffic routes through localhost:dynamicPort
- [x] Tunnel status indicator component shows "SSH Tunnel Active" (via ConnectionStatusIndicator)
- [x] Reconnection is handled by SSHTunnel class (from 14-01)
- [x] Closing database connection also closes SSH tunnel
- [x] SSH credentials stored securely via safeStorage
