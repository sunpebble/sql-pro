-- Migration: 0002_users_and_sessions.sql
-- Add users table and session management for OAuth login

-- Users table (OAuth providers)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  
  -- OAuth provider info
  provider TEXT NOT NULL CHECK(provider IN ('github', 'google')),
  provider_id TEXT NOT NULL,
  
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  UNIQUE(provider, provider_id)
);

-- Sessions table (for web login)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- SSO tokens (one-time tokens for app login)
CREATE TABLE IF NOT EXISTS sso_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Link licenses to users (optional, for users who login after purchase)
ALTER TABLE licenses ADD COLUMN user_id TEXT REFERENCES users(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_provider ON users(provider, provider_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sso_tokens_token ON sso_tokens(token);
CREATE INDEX IF NOT EXISTS idx_sso_tokens_user ON sso_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_user ON licenses(user_id);
