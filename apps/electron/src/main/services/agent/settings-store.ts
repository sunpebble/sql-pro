// Agent Settings Store
// Manages AI Agent configuration and execution settings

import type { AgentSettings } from '@shared/types/agent';
import { DEFAULT_AGENT_SETTINGS } from '@shared/types/agent';
import Store from 'electron-store';

interface SettingsSchema {
  agent: AgentSettings;
}

const settingsStore = new Store<SettingsSchema>({
  name: 'agent-settings',
  defaults: {
    agent: DEFAULT_AGENT_SETTINGS,
  },
});

console.warn('[Agent Settings Store] Initialized, path:', settingsStore.path);

export const agentSettingsStore = {
  /**
   * Get agent settings
   */
  getSettings(): AgentSettings {
    const settings = settingsStore.get('agent');
    console.warn(
      '[Agent Settings Store] getSettings:',
      JSON.stringify(settings.config, null, 2)
    );
    return settings;
  },

  /**
   * Save agent settings
   */
  saveSettings(settings: Partial<AgentSettings>): AgentSettings {
    const current = this.getSettings();

    // Merge config
    const mergedConfig = { ...current.config, ...settings.config };

    // If apiType is null, it means "auto-detect" - delete the field
    if (settings.config && settings.config.apiType === null) {
      delete mergedConfig.apiType;
    }

    const updated: AgentSettings = {
      config: mergedConfig,
      execution: { ...current.execution, ...settings.execution },
    };
    console.warn('[Agent Settings Store] Saving to:', settingsStore.path);
    settingsStore.set('agent', updated);
    console.warn('[Agent Settings Store] Saved successfully');
    return updated;
  },

  /**
   * Reset to defaults
   */
  resetSettings(): AgentSettings {
    settingsStore.set('agent', DEFAULT_AGENT_SETTINGS);
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
