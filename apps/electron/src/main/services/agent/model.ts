// Model Provider Factory
// Creates language models based on AgentConfig settings

import type { AgentConfig } from '@shared/types/agent';
import type { LanguageModel } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

/**
 * Result of creating a chat model
 */
export interface ChatModelResult {
  model: LanguageModel;
  /** Whether using direct Anthropic API (supports extended thinking) */
  isDirectAnthropic: boolean;
  /** The effective API type being used */
  effectiveApiType: 'openai' | 'anthropic';
}

/**
 * Detect API type from base URL and/or model name
 * Model name is often more reliable for detecting the provider
 */
export function detectApiType(
  baseUrl: string,
  model?: string
): 'openai' | 'anthropic' {
  // If using custom URL, assume OpenAI-compatible format
  // (proxy services like new-api, one-api typically use OpenAI format)
  if (baseUrl && !baseUrl.includes('api.anthropic.com')) {
    return 'openai';
  }

  // For official Anthropic API or no URL, check model name
  if (model) {
    const modelLower = model.toLowerCase();
    // Claude models: claude-3-opus, claude-3-sonnet, claude-3-haiku, claude-opus-4, etc.
    if (modelLower.includes('claude') || modelLower.startsWith('claude-')) {
      return 'anthropic';
    }
  }

  // Fall back to URL-based detection
  const url = baseUrl.toLowerCase();
  if (url.includes('anthropic') || url.includes('claude')) {
    return 'anthropic';
  }
  return 'openai';
}

/**
 * Normalize base URL to ensure it has the correct path
 * Most OpenAI-compatible APIs expect /v1 suffix
 */
function normalizeBaseUrl(baseUrl: string): string {
  if (!baseUrl) return baseUrl;

  // Remove trailing slash
  let url = baseUrl.replace(/\/+$/, '');

  // If URL doesn't end with /v1 and doesn't contain /v1/, add it
  // This handles proxy services like new-api, one-api that need /v1
  if (!url.endsWith('/v1') && !url.includes('/v1/')) {
    url = `${url}/v1`;
  }

  return url;
}

/**
 * Create a language model instance based on configuration
 */
export function createChatModel(config: AgentConfig): ChatModelResult {
  // For custom URLs (proxy services like new-api, one-api),
  // ALWAYS use OpenAI-compatible format regardless of apiType setting
  // because these proxies expect OpenAI API format
  const isCustomUrl =
    config.baseUrl &&
    !config.baseUrl.includes('api.openai.com') &&
    !config.baseUrl.includes('api.anthropic.com');

  // Check if using direct Anthropic API
  const isDirectAnthropic =
    !isCustomUrl &&
    (!config.baseUrl || config.baseUrl.includes('api.anthropic.com')) &&
    (config.apiType === 'anthropic' ||
      (!config.apiType && config.model?.toLowerCase().includes('claude')));

  // Determine effective API type
  let effectiveApiType: 'openai' | 'anthropic';
  if (isCustomUrl) {
    // Custom URL = always use OpenAI-compatible
    effectiveApiType = 'openai';
  } else if (config.apiType) {
    // User explicitly set apiType
    effectiveApiType = config.apiType;
  } else {
    // Auto-detect based on URL/model
    effectiveApiType = detectApiType(config.baseUrl, config.model);
  }

  // Normalize URL for custom endpoints
  const normalizedUrl = isCustomUrl
    ? normalizeBaseUrl(config.baseUrl)
    : config.baseUrl;

  console.warn('[Agent Model] Creating model:', {
    model: config.model,
    baseUrl: config.baseUrl,
    normalizedUrl,
    isCustomUrl,
    isDirectAnthropic,
    userApiType: config.apiType,
    effectiveApiType,
  });

  if (effectiveApiType === 'anthropic') {
    console.warn('[Agent Model] Using Anthropic provider');
    const anthropic = createAnthropic({
      apiKey: config.apiKey,
      baseURL: config.baseUrl || undefined,
    });
    return {
      model: anthropic(config.model),
      isDirectAnthropic,
      effectiveApiType,
    };
  }

  // For custom endpoints, use OpenAI-compatible provider
  if (config.baseUrl && !config.baseUrl.includes('api.openai.com')) {
    console.warn(
      '[Agent Model] Using OpenAI-compatible provider for custom URL:',
      normalizedUrl
    );
    const provider = createOpenAICompatible({
      name: 'custom-provider',
      apiKey: config.apiKey,
      baseURL: normalizedUrl,
    });
    return {
      model: provider(config.model),
      isDirectAnthropic: false,
      effectiveApiType,
    };
  }

  console.warn('[Agent Model] Using default OpenAI provider');
  // Default OpenAI
  const openai = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseUrl || undefined,
  });
  return {
    model: openai(config.model),
    isDirectAnthropic: false,
    effectiveApiType,
  };
}
