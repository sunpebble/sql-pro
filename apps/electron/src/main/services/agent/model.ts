// Model Provider Factory
// Creates language models based on AgentConfig settings

import type { AgentConfig } from '@shared/types/agent';
import type { LanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * Detect API type from base URL
 */
export function detectApiType(baseUrl: string): 'openai' | 'anthropic' {
  const url = baseUrl.toLowerCase();
  if (url.includes('anthropic') || url.includes('claude')) {
    return 'anthropic';
  }
  return 'openai';
}

/**
 * Create a language model instance based on configuration
 */
export function createChatModel(config: AgentConfig): LanguageModel {
  const apiType = config.apiType ?? detectApiType(config.baseUrl);

  if (apiType === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
    });
    return anthropic(config.model);
  }

  // Check if it's the default OpenAI API or a compatible provider
  if (config.baseUrl && !config.baseUrl.includes('api.openai.com')) {
    // Use OpenAI-compatible provider for custom endpoints
    const provider = createOpenAICompatible({
      name: 'custom-provider',
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
    return provider(config.model);
  }

  // Default OpenAI
  const openai = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined,
  });
  return openai(config.model);
}
