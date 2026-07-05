# Quarry - GitHub Copilot Instructions

## Project Overview

Quarry is a professional database manager for macOS, built as a native SwiftUI application. It supports SQLite (including SQLCipher-encrypted databases), PostgreSQL, and MySQL, with schema/data comparison, diff-previewed editing, SSH tunnels, and English/Chinese localization.

## Technology Stack

- **App**: Swift 5.9+, SwiftUI, SwiftPM (`apps/swiftui`)
  - `QuarryCore` — engines and pure logic (no UI imports, fully unit-testable)
  - `QuarrySwiftUI` — interface layer; `QuarryAppState` is the single state container
- **Native libraries**: SQLCipher, libpq (PostgreSQL), libmysqlclient — installed via Homebrew, linked as SwiftPM system libraries
- **Backend**: Cloudflare Workers + Hono (`packages/cloudflare`, `packages/license-api`), Stripe for Pro licenses
- **Docs**: VitePress (`packages/docs`)
- **Monorepo tooling**: pnpm + Nx (for the JS packages only)

## Repository Layout

```
├── apps/
│   ├── swiftui/            # The macOS app
│   └── video/              # Remotion promo video (static screenshots)
├── packages/
│   ├── docs/               # VitePress documentation site
│   ├── cloudflare/         # Workers backend
│   ├── license-api/        # License API (Stripe webhooks)
│   └── tsconfig/           # Shared TS configs
```

## Development

```bash
pnpm install                              # JS tooling
brew install sqlcipher postgresql@16 mysql

pnpm dev     # swift run --package-path apps/swiftui
pnpm build   # swift build --package-path apps/swiftui
pnpm test    # swift test --package-path apps/swiftui
pnpm lint    # eslint (workers/docs code)
pnpm typecheck
```

## Conventions

- **Engine seam**: all database operations go through the `DatabaseEngine` protocol; UI code never talks to a concrete engine. New database support = new protocol conformance.
- **Core/UI split**: put pure logic in `QuarryCore` with XCTest coverage; keep `QuarrySwiftUI` thin.
- **Secrets**: connection passwords and the license cache live in the macOS Keychain (`KeychainPasswordStore`) — never in UserDefaults or JSON files.
- **Localization**: user-facing strings go through `L("…")` with entries in both `en.lproj` and `zh-Hans.lproj` `Localizable.strings`.
- **Commits**: Conventional Commits, enforced by commitlint; pre-commit runs lint-staged.
