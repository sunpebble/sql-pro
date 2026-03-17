# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in SQL Pro, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please email us at **support@sqlpro.app** with:

1. A description of the vulnerability
2. Steps to reproduce (if applicable)
3. The potential impact
4. Any suggested fixes (optional)

### What to Expect

- **Acknowledgment**: We will acknowledge your report within 48 hours.
- **Assessment**: We will investigate and assess the vulnerability within 7 days.
- **Resolution**: We aim to release a fix within 30 days of confirmation.
- **Credit**: We will credit you in the release notes (unless you prefer to remain anonymous).

## Scope

This policy covers the SQL Pro desktop application and its associated packages in this repository. Third-party dependencies are managed through regular updates and automated security scanning.

## Best Practices for Users

- Always download SQL Pro from [official releases](https://github.com/kunish-homelab/sql-pro/releases)
- Keep your installation up to date
- Use strong passwords for encrypted databases (SQLCipher)
- Review plugin permissions before installing third-party plugins

## Security Features

SQL Pro includes several built-in security measures:

- **SQLCipher support** for encrypted database files
- **Sandboxed plugin execution** to isolate third-party code
- **No telemetry** — SQL Pro does not collect or transmit user data
- **Local-first architecture** — your data stays on your machine
