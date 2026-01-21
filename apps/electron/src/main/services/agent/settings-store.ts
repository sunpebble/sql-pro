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

export const agentSettingsStore = {
  /**
   * Get agent settings
   */
  getSettings(): AgentSettings {
    return settingsStore.get('agent');
  },

  /**
   * Save agent settings
   */
  saveSettings(settings: Partial<AgentSettings>): AgentSettings {
    const current = this.getSettings();
    const updated: AgentSettings = {
      config: { ...current.config, ...settings.config },
      execution: { ...current.execution, ...settings.execution },
    };
    settingsStore.set('agent', updated);
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
