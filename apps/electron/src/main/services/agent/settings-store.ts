// Agent Settings Store
// Manages AI Agent configuration and execution settings
// API keys are encrypted using Electron's safeStorage API

import type { AgentSettings } from '@shared/types/agent';
import { Buffer } from 'node:buffer';
import { DEFAULT_AGENT_SETTINGS } from '@shared/types/agent';
import { safeStorage } from 'electron';
import Store from 'electron-store';

/**
 * Internal storage schema - apiKey is stored encrypted as base64
 */
interface StoredAgentConfig {
  baseUrl: string;
  /** Encrypted API key (base64 encoded) */
  encryptedApiKey?: string;
  /** @deprecated Plain-text API key for migration only */
  apiKey?: string;
  model: string;
  apiType?: 'openai' | 'anthropic';
}

interface SettingsSchema {
  agent: {
    config: StoredAgentConfig;
    execution: AgentSettings['execution'];
  };
}

const settingsStore = new Store<SettingsSchema>({
  name: 'agent-settings',
  defaults: {
    agent: {
      config: {
        baseUrl: DEFAULT_AGENT_SETTINGS.config.baseUrl,
        model: DEFAULT_AGENT_SETTINGS.config.model,
        encryptedApiKey: undefined,
      },
      execution: DEFAULT_AGENT_SETTINGS.execution,
    },
  },
});

/**
 * Encrypt a string using Electron's safeStorage API.
 * Returns base64-encoded encrypted data.
 */
function encryptValue(value: string): string | undefined {
  if (!value) return undefined;
  if (!safeStorage.isEncryptionAvailable()) {
    console.warn(
      '[AgentSettings] Encryption not available, API key will be stored in plain text'
    );
    return undefined;
  }
  const encrypted = safeStorage.encryptString(value);
  return encrypted.toString('base64');
}

/**
 * Decrypt a base64-encoded encrypted string using Electron's safeStorage API.
 */
function decryptValue(encryptedBase64: string): string {
  const encrypted = Buffer.from(encryptedBase64, 'base64');
  return safeStorage.decryptString(encrypted);
}

/**
 * Migrate plain-text apiKey to encrypted storage if needed.
 * This handles existing installations that stored API keys in plain text.
 */
function migrateApiKeyIfNeeded(): void {
  try {
    const stored = settingsStore.get('agent');
    if (
      stored?.config?.apiKey &&
      !stored?.config?.encryptedApiKey &&
      safeStorage.isEncryptionAvailable()
    ) {
      const encrypted = encryptValue(stored.config.apiKey);
      if (encrypted) {
        settingsStore.set('agent.config.encryptedApiKey', encrypted);
        // Remove plain-text key after successful encryption
        settingsStore.delete('agent.config.apiKey' as any);
        console.warn(
          '[AgentSettings] Migrated API key from plain text to encrypted storage'
        );
      }
    }
  } catch (error) {
    console.error('[AgentSettings] Failed to migrate API key:', error);
  }
}

// Run migration on module load
migrateApiKeyIfNeeded();

export const agentSettingsStore = {
  /**
   * Get agent settings with decrypted API key
   */
  getSettings(): AgentSettings {
    const stored = settingsStore.get('agent');
    let apiKey = '';

    // Try to decrypt the encrypted API key
    if (stored.config.encryptedApiKey) {
      try {
        apiKey = decryptValue(stored.config.encryptedApiKey);
      } catch (error) {
        console.error('[AgentSettings] Failed to decrypt API key:', error);
      }
    } else if (stored.config.apiKey) {
      // Fallback to plain-text key (pre-migration or encryption unavailable)
      apiKey = stored.config.apiKey;
    }

    return {
      config: {
        baseUrl: stored.config.baseUrl,
        apiKey,
        model: stored.config.model,
        ...(stored.config.apiType ? { apiType: stored.config.apiType } : {}),
      },
      execution: stored.execution,
    };
  },

  /**
   * Save agent settings with encrypted API key
   */
  saveSettings(settings: Partial<AgentSettings>): AgentSettings {
    const current = this.getSettings();

    // Merge config
    const mergedConfig = { ...current.config, ...settings.config };

    // If apiType is null, it means "auto-detect" - delete the field
    if (settings.config && settings.config.apiType === null) {
      delete mergedConfig.apiType;
    }

    // Build the stored config with encryption
    const storedConfig: StoredAgentConfig = {
      baseUrl: mergedConfig.baseUrl,
      model: mergedConfig.model,
      ...(mergedConfig.apiType ? { apiType: mergedConfig.apiType } : {}),
    };

    // Encrypt the API key if available
    if (mergedConfig.apiKey) {
      const encrypted = encryptValue(mergedConfig.apiKey);
      if (encrypted) {
        storedConfig.encryptedApiKey = encrypted;
        // Don't store plain-text key when encryption is available
      } else {
        // Fallback: store as plain text if encryption is not available
        storedConfig.apiKey = mergedConfig.apiKey;
      }
    }

    const updated = {
      config: storedConfig,
      execution: { ...current.execution, ...settings.execution },
    };
    settingsStore.set('agent', updated);

    // Return the decrypted version for callers
    return {
      config: mergedConfig,
      execution: updated.execution,
    };
  },

  /**
   * Reset to defaults
   */
  resetSettings(): AgentSettings {
    settingsStore.set('agent', {
      config: {
        baseUrl: DEFAULT_AGENT_SETTINGS.config.baseUrl,
        model: DEFAULT_AGENT_SETTINGS.config.model,
        encryptedApiKey: undefined,
      },
      execution: DEFAULT_AGENT_SETTINGS.execution,
    });
    return DEFAULT_AGENT_SETTINGS;
  },

  /**
   * Check if agent is configured
   */
  isConfigured(): boolean {
    const settings = this.getSettings();
    return Boolean(settings.config.apiKey && settings.config.model);
  },
};
