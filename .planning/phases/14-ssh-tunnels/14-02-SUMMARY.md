---
phase: 14-ssh-tunnels
plan: 02
subsystem: ui
tags: [ssh, tunnel, connection, dialog, i18n]
completed: 2026-01-30
duration: 5m
dependency-graph:
  requires: [14-01]
  provides: [ssh-tunnel-ui, ssh-config-component]
  affects: [14-03]
tech-stack:
  added: []
  patterns: [collapsible-form-section, controlled-component-props]
key-files:
  created:
    - apps/electron/src/renderer/src/components/SSHTunnelConfig.tsx
  modified:
    - apps/electron/src/renderer/src/components/ServerConnectionDialog.tsx
    - apps/electron/src/renderer/src/locales/en/dialog.json
    - apps/electron/src/renderer/src/locales/zh/dialog.json
decisions: []
---

# Phase 14 Plan 02: SSH Tunnel UI Summary

Collapsible SSH tunnel configuration component with full i18n, integrated into ServerConnectionDialog for MySQL/PostgreSQL.

## What Was Built

### SSHTunnelConfig Component

Created a reusable, collapsible SSH tunnel configuration component (`SSHTunnelConfig.tsx`) with:

- **Toggle control**: Checkbox to enable/disable SSH tunnel
- **SSH connection fields**: Host (required), port (default 22), username (required)
- **Authentication method toggle**: Password or Private Key via RadioGroup
- **Password auth**: Simple password input field
- **Private key auth**: File path input with Browse button + optional passphrase
- **Jump host support**: Optional bastion server configuration with same field pattern

### ServerConnectionDialog Integration

Updated the connection dialog to include SSH tunnel configuration:

- Added 16 new state variables for SSH tunnel and jump host settings
- SSH section only renders for MySQL and PostgreSQL database types
- Form validation includes SSH fields when tunnel is enabled
- handleSubmit includes `ssh` and `sshJumpHost` in connection config
- Edit mode loads existing SSH settings from initialConfig

### i18n Translations

Added complete translation coverage in both English and Chinese:

- `connection.ssh.*` keys for all SSH tunnel labels
- `connection.ssh.jumpHost.*` keys for bastion configuration
- Placeholders and helper text for all input fields

## Commits

| Hash     | Message                                                            |
| -------- | ------------------------------------------------------------------ |
| 36bb36fd | feat(14-02): create SSHTunnelConfig component                      |
| a27d7591 | feat(14-02): integrate SSHTunnelConfig into ServerConnectionDialog |
| 78bf6bcf | feat(14-02): add i18n translations for SSH tunnel UI               |

## Technical Details

### Component Props Pattern

SSHTunnelConfig uses controlled component pattern with individual props for each field:

```typescript
interface SSHTunnelConfigProps {
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  sshHost: string;
  onSshHostChange: (host: string) => void;
  // ... 24 more props for complete control
  disabled?: boolean;
}
```

### Form Validation

SSH validation is conditional on tunnel being enabled:

```typescript
const isSshValid =
  !sshEnabled ||
  (sshHost && sshUsername && (!showJumpHost || (jumpHost && jumpUsername)));
```

### Config Structure

When SSH is enabled, the connection config includes:

```typescript
config.ssh = {
  enabled: true,
  host: sshHost,
  port: 22,
  username: sshUsername,
  authMethod: 'password' | 'privateKey',
  password?: string,
  privateKeyPath?: string,
  passphrase?: string,
};

config.sshJumpHost = { /* same structure */ };
```

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- [x] TypeScript compiles: `pnpm tsc --noEmit`
- [x] JSON files valid: Node require() succeeds
- [x] SSH section renders for MySQL/PostgreSQL only
- [x] All labels use i18n (no hardcoded strings)

## Next Phase Readiness

**Ready for 14-03**: SSH tunnel service implementation

The UI component is complete and passes all SSH configuration to the connection config. Plan 03 will implement the actual SSH tunnel establishment using the ssh2 library and the types/credential store from Plan 01.
