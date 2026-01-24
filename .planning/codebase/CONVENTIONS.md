# Coding Conventions

**Analysis Date:** 2026-01-25

## Naming Patterns

**Files:**

- kebab-case for configuration files (e.g., `eslint.config.mjs`, `vitest.config.ts`).
- PascalCase for React components and UI-related files (inferred from common React patterns and file structure).
- camelCase for utility files or non-component-related TypeScript files (e.g., `query-history-store.test.ts`).

**Functions:**

- camelCase (inferred from common TypeScript practices).

**Variables:**

- camelCase (inferred from common TypeScript practices).

**Types:**

- PascalCase for interfaces and types (inferred from common TypeScript practices).

## Code Style

**Formatting:**

- **Tool used:** Prettier
- **Config file:** `/Users/shikun/Developer/opensource/sql-pro/.prettierrc`
- **Key settings:**
  - `semi: true` (semicolons are used)
  - `singleQuote: true` (single quotes for strings)
  - `tabWidth: 2` (2 spaces for indentation)
  - `trailingComma: "es5"` (trailing commas where valid in ES5)
  - `plugins: ["prettier-plugin-tailwindcss"]` (Tailwind CSS specific formatting)

**Linting:**

- **Tool used:** ESLint (`@antfu/eslint-config` based)
- **Config file:** `/Users/shikun/Developer/opensource/sql-pro/eslint.config.mjs`
- **Key rules:**
  - React support enabled.
  - TypeScript support enabled.
  - Formatters are disabled as Prettier handles formatting.
  - Stylistic rules are disabled for the same reason.
  - `unicorn/number-literal-case` is explicitly turned off.

## Import Organization

**Order:**

1. External dependencies
2. Internal aliases (e.g., `@`, `@shared`)
3. Relative imports

**Path Aliases:**

- `@`: `src/renderer/src` (for `apps/electron`)
- `@shared`: `src/shared` (for `apps/electron`)

## Error Handling

**Patterns:**

- Not explicitly defined in configuration. Typically handled with try-catch blocks and conditional rendering in React components.

## Logging

**Framework:** Not explicitly defined in configuration.
**Patterns:**

- Likely `console.log`, `console.warn`, `console.error` for development, possibly `electron-log` for Electron app in production.

## Comments

**When to Comment:**

- Not explicitly defined in configuration. Follow standard best practices for clarity, complex logic, and public API explanations.

**JSDoc/TSDoc:**

- Not explicitly defined in configuration.

## Function Design

**Size:** Not explicitly defined in configuration.
**Parameters:** Not explicitly defined in configuration.
**Return Values:** Not explicitly defined in configuration.

## Module Design

**Exports:** Not explicitly defined in configuration. Likely a mix of named and default exports depending on the module's purpose.
**Barrel Files:** Not explicitly detected in configuration.

---

_Convention analysis: 2026-01-25_
