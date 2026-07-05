# Getting Started

Welcome to Quarry! This guide will help you get up and running quickly with our open-source, native macOS database manager.

::: tip New User?
Follow this guide in order: **Installation** → **First Connection** → **Explore Features**
:::

## What You'll Learn

This getting started guide covers everything you need to begin using Quarry effectively:

| Guide                                                 | Description                                       |
| ----------------------------------------------------- | ------------------------------------------------- |
| [Installation](/getting-started/installation)         | Download and install Quarry on macOS              |
| [First Connection](/getting-started/first-connection) | Open your first database and run your first query |

## Quick Overview

Quarry is a professional database management tool with support for:

- **SQLite databases** - Open any `.db`, `.sqlite`, `.sqlite3`, or `.db3` file
- **Encrypted databases** - Full SQLCipher support with passwords stored in the macOS Keychain
- **PostgreSQL and MySQL servers** - Connect directly or through an SSH tunnel

::: tip New to SQLite?
SQLite is a lightweight, file-based database that doesn't require a server. It's perfect for mobile apps, desktop applications, and small to medium-sized projects. Each database is a single file that you can easily copy, backup, and share.
:::

## System Requirements

Before installing, make sure your system meets these requirements:

- **Operating System**: macOS 14 or later
- **Hardware**: Apple Silicon Mac (M1 or newer)

## Getting Started Steps

### Step 1: Install Quarry

Download the latest `Quarry-*.zip` from GitHub Releases and drag the app into your Applications folder. Detailed instructions are in the [Installation guide](/getting-started/installation).

### Step 2: Open a Database

Launch Quarry and open an existing SQLite database, create a new one, or connect to a PostgreSQL/MySQL server. Learn how to [connect to your first database](/getting-started/first-connection).

### Step 3: Explore Your Data

Browse tables, run queries, and edit data with Quarry's intuitive interface.

## What's Next?

After completing the getting started guides, explore these resources:

### Core Features

- 📝 [Query Editor](/features/query-editor) - Write and execute SQL with the native editor and EXPLAIN view
- 🗄️ [Schema Browser](/features/schema-browser) - Navigate your database structure
- ✏️ [Data Editing](/features/data-editing) - Edit data inline with pending-changes preview
- 🎯 [ER Diagrams](/features/er-diagram) - Visualize table relationships
- 📜 [Query Library](/features/query-history) - Access query history and favorites

### Advanced Topics

- ⌨️ [Keyboard Shortcuts](/shortcuts) - Speed up your workflow
- 🔒 [SQLCipher Support](/features/sqlcipher) - Work with encrypted databases
- 🛠️ [Troubleshooting](/troubleshooting) - Find solutions to common issues

### Get Help

::: info Need Assistance?

- 💬 [GitHub Discussions](https://github.com/sunpebble/quarry/discussions) - Community support
- 🐛 [Report an Issue](https://github.com/sunpebble/quarry/issues) - Bug reports and feature requests
- 📚 [Full Documentation](/) - Complete feature documentation
  :::
