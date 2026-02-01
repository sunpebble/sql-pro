/**
 * Model Registry
 *
 * Centralized registry for AI model providers.
 * Manages model creation, configuration, and provider detection.
 */


// Re-export from the services layer for now
export {
  type ChatModelResult,
  createChatModel,
  detectApiType,
} from '../../services/agent/model';

// ============================================
// Model Provider Types
// ============================================

export type ModelProvider = 'openai' | 'anthropic' | 'custom';

export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  contextWindow: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
}

// ============================================
// Known Models Registry
// ============================================

const KNOWN_MODELS: Record<string, ModelInfo> = {
  // OpenAI Models
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128000,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    contextWindow: 16385,
    supportsTools: true,
    supportsVision: false,
    supportsStreaming: true,
  },
  // Anthropic Models
  'claude-3-5-sonnet-20241022': {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'claude-3-opus-20240229': {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
  'claude-3-haiku-20240307': {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    supportsTools: true,
    supportsVision: true,
    supportsStreaming: true,
  },
};

// ============================================
// Model Registry Class
// ============================================

class ModelRegistry {
  private customModels: Map<string, ModelInfo> = new Map();

  /**
   * Get info for a known model
   */
  getModelInfo(modelId: string): ModelInfo | undefined {
    // Check custom models first
    if (this.customModels.has(modelId)) {
      return this.customModels.get(modelId);
    }
    // Check known models
    return KNOWN_MODELS[modelId];
  }

  /**
   * Register a custom model
   */
  registerModel(info: ModelInfo): void {
    this.customModels.set(info.id, info);
  }

  /**
   * Unregister a custom model
   */
  unregisterModel(modelId: string): boolean {
    return this.customModels.delete(modelId);
  }

  /**
   * Get all known models
   */
  getAllModels(): ModelInfo[] {
    return [
      ...Object.values(KNOWN_MODELS),
      ...Array.from(this.customModels.values()),
    ];
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: ModelProvider): ModelInfo[] {
    return this.getAllModels().filter((m) => m.provider === provider);
  }

  /**
   * Detect provider from model name
   */
  detectProvider(modelName: string): ModelProvider {
    const lower = modelName.toLowerCase();
    if (lower.includes('claude')) return 'anthropic';
    if (lower.includes('gpt')) return 'openai';
    return 'custom';
  }

  /**
   * Check if a model supports tools
   */
  supportsTools(modelId: string): boolean {
    const info = this.getModelInfo(modelId);
    return info?.supportsTools ?? true; // Assume true for unknown models
  }

  /**
   * Get context window size for a model
   */
  getContextWindow(modelId: string): number {
    const info = this.getModelInfo(modelId);
    return info?.contextWindow ?? 128000; // Default to 128k
  }
}

// Export singleton instance
export const modelRegistry = new ModelRegistry();

// Export class for custom instances
export { ModelRegistry };
