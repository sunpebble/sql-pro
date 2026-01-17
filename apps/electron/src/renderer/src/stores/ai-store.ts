import type {
  AIProvider,
  AIProviderSettings,
  AISettings,
  AISettingsUpdate,
  EmbeddingSettings,
} from '@shared/types';
import { DEFAULT_AI_BASE_URLS } from '@shared/types';
import { create } from 'zustand';
import { sqlPro } from '@/lib/api';
import { withRetryOrDefault } from '@/lib/ipc-retry';

interface AIState {
  // Current provider
  provider: AIProvider;

  // Per-provider settings
  providerSettings: {
    anthropic: AIProviderSettings;
    openai: AIProviderSettings;
    custom: AIProviderSettings;
  };

  // Claude Code
  claudeCodePath: string;
  availableClaudeCodePaths: string[];
  isLoadingClaudeCodePaths: boolean;

  // Embedding settings
  embedding: EmbeddingSettings;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Computed accessor for current provider's settings
  getCurrentSettings: () => AIProviderSettings;
  isConfigured: boolean;

  // Actions
  loadSettings: () => Promise<void>;
  saveSettings: (settings: AISettingsUpdate) => Promise<boolean>;
  loadClaudeCodePaths: () => Promise<void>;
  setProvider: (provider: AIProvider) => void;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setClaudeCodePath: (path: string) => void;
  setEmbedding: (embedding: Partial<EmbeddingSettings>) => void;
  clearSettings: () => void;
  getEffectiveBaseUrl: () => string;

  // Legacy accessors for backward compatibility
  apiKey: string;
  model: string;
  baseUrl: string;
}

// Default models for each provider
export const DEFAULT_MODELS: Record<AIProvider, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: [
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-20250219',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
  ],
  custom: [],
};

const DEFAULT_PROVIDER_SETTINGS: Record<AIProvider, AIProviderSettings> = {
  anthropic: { apiKey: '', baseUrl: '', model: DEFAULT_MODELS.anthropic[0] },
  openai: { apiKey: '', baseUrl: '', model: DEFAULT_MODELS.openai[0] },
  custom: { apiKey: '', baseUrl: '', model: '' },
};

const DEFAULT_EMBEDDING_SETTINGS: EmbeddingSettings = {
  enabled: false,
  provider: 'openai',
  model: 'text-embedding-3-small',
  dimensions: 1536,
};

export const useAIStore = create<AIState>((set, get) => ({
  provider: 'anthropic',
  providerSettings: {
    anthropic: { ...DEFAULT_PROVIDER_SETTINGS.anthropic },
    openai: { ...DEFAULT_PROVIDER_SETTINGS.openai },
    custom: { ...DEFAULT_PROVIDER_SETTINGS.custom },
  },
  claudeCodePath: '',
  availableClaudeCodePaths: [],
  isLoadingClaudeCodePaths: false,
  embedding: { ...DEFAULT_EMBEDDING_SETTINGS },
  isLoading: false,
  isSaving: false,

  // Legacy getters for backward compatibility
  get apiKey() {
    const state = get();
    return state.providerSettings[state.provider]?.apiKey || '';
  },
  get model() {
    const state = get();
    return state.providerSettings[state.provider]?.model || '';
  },
  get baseUrl() {
    const state = get();
    return state.providerSettings[state.provider]?.baseUrl || '';
  },
  get isConfigured() {
    const state = get();
    return Boolean(state.providerSettings[state.provider]?.apiKey);
  },

  getCurrentSettings: () => {
    const state = get();
    return state.providerSettings[state.provider] || {};
  },

  loadSettings: async () => {
    set({ isLoading: true });
    try {
      const result = await withRetryOrDefault(
        () => sqlPro.ai.getSettings(),
        { success: false } as Awaited<ReturnType<typeof sqlPro.ai.getSettings>>,
        { silent: true }
      );
      if (result.success && result.settings) {
        const settings = result.settings as AISettings;

        // Load per-provider settings
        const providerSettings = {
          anthropic: {
            apiKey: settings.providerSettings?.anthropic?.apiKey || '',
            baseUrl: settings.providerSettings?.anthropic?.baseUrl || '',
            model:
              settings.providerSettings?.anthropic?.model ||
              DEFAULT_MODELS.anthropic[0],
          },
          openai: {
            apiKey: settings.providerSettings?.openai?.apiKey || '',
            baseUrl: settings.providerSettings?.openai?.baseUrl || '',
            model:
              settings.providerSettings?.openai?.model ||
              DEFAULT_MODELS.openai[0],
          },
          custom: {
            apiKey: settings.providerSettings?.custom?.apiKey || '',
            baseUrl: settings.providerSettings?.custom?.baseUrl || '',
            model: settings.providerSettings?.custom?.model || '',
          },
        };

        // Load embedding settings
        const embedding: EmbeddingSettings = {
          enabled:
            settings.embedding?.enabled ?? DEFAULT_EMBEDDING_SETTINGS.enabled,
          provider:
            settings.embedding?.provider ?? DEFAULT_EMBEDDING_SETTINGS.provider,
          model: settings.embedding?.model ?? DEFAULT_EMBEDDING_SETTINGS.model,
          baseUrl: settings.embedding?.baseUrl,
          apiKey: settings.embedding?.apiKey,
          dimensions:
            settings.embedding?.dimensions ??
            DEFAULT_EMBEDDING_SETTINGS.dimensions,
        };

        set({
          provider: settings.provider ?? 'anthropic',
          providerSettings,
          claudeCodePath: settings.claudeCodePath || '',
          embedding,
        });
      }
    } catch (error) {
      console.error('Failed to load AI settings:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  loadClaudeCodePaths: async () => {
    set({ isLoadingClaudeCodePaths: true });
    try {
      const result = await sqlPro.ai.getClaudeCodePaths();
      if (result.success && result.paths) {
        set({ availableClaudeCodePaths: result.paths });
      }
    } catch (error) {
      console.error('Failed to load Claude Code paths:', error);
    } finally {
      set({ isLoadingClaudeCodePaths: false });
    }
  },

  saveSettings: async (settings) => {
    const state = get();

    // Build the new provider settings
    const newProviderSettings = { ...state.providerSettings };

    if (settings.provider !== undefined) {
      // Provider is changing
    }

    // Update current provider's settings if provided
    const currentProvider = settings.provider ?? state.provider;
    if (settings.apiKey !== undefined) {
      newProviderSettings[currentProvider] = {
        ...newProviderSettings[currentProvider],
        apiKey: settings.apiKey,
      };
    }
    if (settings.baseUrl !== undefined) {
      newProviderSettings[currentProvider] = {
        ...newProviderSettings[currentProvider],
        baseUrl: settings.baseUrl,
      };
    }
    if (settings.model !== undefined) {
      newProviderSettings[currentProvider] = {
        ...newProviderSettings[currentProvider],
        model: settings.model,
      };
    }

    const newSettings: AISettings = {
      provider: settings.provider ?? state.provider,
      providerSettings: newProviderSettings,
      claudeCodePath: settings.claudeCodePath ?? state.claudeCodePath,
      embedding: state.embedding,
    };

    set({ isSaving: true });
    try {
      const result = await sqlPro.ai.saveSettings({
        settings: newSettings,
      });
      if (result.success) {
        set({
          provider: newSettings.provider,
          providerSettings: newProviderSettings,
          claudeCodePath: newSettings.claudeCodePath || '',
          embedding: newSettings.embedding,
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save AI settings:', error);
      return false;
    } finally {
      set({ isSaving: false });
    }
  },

  setProvider: (provider) => {
    // Just switch provider - settings are already stored per-provider
    set({ provider });
  },

  setApiKey: (apiKey) => {
    const state = get();
    const newProviderSettings = { ...state.providerSettings };
    newProviderSettings[state.provider] = {
      ...newProviderSettings[state.provider],
      apiKey,
    };
    set({ providerSettings: newProviderSettings });
  },

  setModel: (model) => {
    const state = get();
    const newProviderSettings = { ...state.providerSettings };
    newProviderSettings[state.provider] = {
      ...newProviderSettings[state.provider],
      model,
    };
    set({ providerSettings: newProviderSettings });
  },

  setBaseUrl: (baseUrl) => {
    const state = get();
    const newProviderSettings = { ...state.providerSettings };
    newProviderSettings[state.provider] = {
      ...newProviderSettings[state.provider],
      baseUrl,
    };
    set({ providerSettings: newProviderSettings });
  },

  setClaudeCodePath: (claudeCodePath) => set({ claudeCodePath }),

  setEmbedding: (embedding) => {
    const state = get();
    set({
      embedding: {
        ...state.embedding,
        ...embedding,
      },
    });
  },

  clearSettings: () =>
    set({
      provider: 'anthropic',
      providerSettings: {
        anthropic: { ...DEFAULT_PROVIDER_SETTINGS.anthropic },
        openai: { ...DEFAULT_PROVIDER_SETTINGS.openai },
        custom: { ...DEFAULT_PROVIDER_SETTINGS.custom },
      },
      claudeCodePath: '',
      embedding: { ...DEFAULT_EMBEDDING_SETTINGS },
    }),

  getEffectiveBaseUrl: () => {
    const state = get();
    const providerBaseUrl = state.providerSettings[state.provider]?.baseUrl;
    return providerBaseUrl || DEFAULT_AI_BASE_URLS[state.provider];
  },
}));
