// useAgent - Hook for AI Agent chat functionality
// Uses Vercel AI SDK via main process IPC

import type {
  AgentSettings,
  ChatSendResponse,
  ChatSession,
} from '@shared/types/agent';
import type { UIMessage } from 'ai';
import { useCallback, useEffect, useRef, useState } from 'react';

const sqlProAPI = window.sqlPro;

// Message part types
interface TextPart {
  type: 'text';
  text: string;
}

interface ReasoningPart {
  type: 'reasoning';
  text: string;
}

interface ToolCallPart {
  type: 'tool-call';
  toolCallId: string;
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  args?: unknown; // Use 'args' to match AI SDK UIMessage format
  result?: unknown; // Use 'result' to match AI SDK UIMessage format
  error?: string;
}

type MessagePart = TextPart | ReasoningPart | ToolCallPart;

// Simplified message type for internal use
interface SimpleMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: MessagePart[];
}

interface UseAgentOptions {
  connectionId: string;
  sessionId?: string;
}

interface UseAgentReturn {
  // State
  messages: SimpleMessage[];
  isLoading: boolean;
  error: string | null;
  settings: AgentSettings | null;
  isConfigured: boolean;
  sessions: ChatSession[];

  // Actions
  sendMessage: (content: string) => Promise<void>;
  cancelChat: () => Promise<void>;
  clearMessages: () => void;
  clearError: () => void;
  reload: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  createNewSession: () => string;
  deleteSession: (sessionId: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
  saveSettings: (settings: Partial<AgentSettings>) => Promise<void>;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Convert UIMessage to SimpleMessage
 */
function toSimpleMessage(msg: UIMessage): SimpleMessage {
  const parts: MessagePart[] = [];

  // Extract text parts
  const textContent =
    msg.parts
      ?.filter(
        (p): p is { type: 'text'; text: string } =>
          p.type === 'text' && 'text' in p
      )
      .map((p) => p.text)
      .join('') || '';

  if (textContent) {
    parts.push({ type: 'text', text: textContent });
  }

  // Extract reasoning parts
  const reasoningContent =
    msg.parts
      ?.filter(
        (p): p is { type: 'reasoning'; text: string } =>
          p.type === 'reasoning' && 'text' in p
      )
      .map((p) => p.text)
      .join('') || '';

  if (reasoningContent) {
    // Add reasoning at the beginning
    parts.unshift({ type: 'reasoning', text: reasoningContent });
  }

  // Ensure at least an empty text part
  if (parts.length === 0) {
    parts.push({ type: 'text', text: '' });
  }

  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    parts,
  };
}

/**
 * Convert SimpleMessage to UIMessage format
 */
function toUIMessage(msg: SimpleMessage): UIMessage {
  return {
    id: msg.id,
    role: msg.role,
    parts: msg.parts,
  } as UIMessage;
}

/**
 * Hook for AI Agent chat functionality
 */
export function useAgent(options: UseAgentOptions): UseAgentReturn {
  const { connectionId, sessionId: initialSessionId } = options;

  // State
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState(
    () => initialSessionId || generateSessionId()
  );

  // Refs
  const streamCleanupRef = useRef<(() => void) | null>(null);
  const abortRef = useRef(false);

  /**
   * Handle incoming stream chunks from Vercel AI SDK fullStream
   */
  const handleStreamChunk = useCallback((chunk: unknown) => {
    if (!chunk || typeof chunk !== 'object') return;

    // Debug: log all incoming chunks
    console.warn('[useAgent] Stream chunk received:', JSON.stringify(chunk));

    const typedChunk = chunk as {
      type?: string;
      textDelta?: string; // AI SDK 4.x
      text?: string; // AI SDK 5.x/6.x
      delta?: string; // AI SDK 5.x/6.x (also used for text-delta)
    };

    // Handle text-delta chunks (main response text)
    // AI SDK 6.x uses 'text' or 'delta' field, 4.x uses 'textDelta'
    if (typedChunk.type === 'text-delta') {
      const deltaText =
        typedChunk.text || typedChunk.delta || typedChunk.textDelta || '';
      if (deltaText) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const textPart = last.parts.find((p) => p.type === 'text');
            const currentText = textPart?.text || '';
            const newText = currentText + deltaText;

            // Update text part, keep other parts
            const newParts = last.parts.map((p) =>
              p.type === 'text' ? { ...p, text: newText } : p
            );
            // If no text part exists, add one
            if (!textPart) {
              newParts.push({ type: 'text' as const, text: newText });
            }

            return [...prev.slice(0, -1), { ...last, parts: newParts }];
          }
          return prev;
        });
      }
    }

    // Handle reasoning-delta chunks (thinking process)
    // AI SDK 6.x uses 'text' field for reasoning-delta, not 'delta'
    if (typedChunk.type === 'reasoning-delta') {
      const reasoningDelta = typedChunk.text || typedChunk.delta || '';
      if (reasoningDelta) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === 'assistant') {
            const reasoningPart = last.parts.find(
              (p) => p.type === 'reasoning'
            );
            const currentReasoning = reasoningPart?.text || '';
            const newReasoning = currentReasoning + reasoningDelta;

            let newParts: MessagePart[];
            if (reasoningPart) {
              // Update existing reasoning part
              newParts = last.parts.map((p) =>
                p.type === 'reasoning' ? { ...p, text: newReasoning } : p
              );
            } else {
              // Add reasoning part at the beginning
              newParts = [
                { type: 'reasoning' as const, text: newReasoning },
                ...last.parts,
              ];
            }

            return [...prev.slice(0, -1), { ...last, parts: newParts }];
          }
          return prev;
        });
      }
    }

    // Handle legacy reasoning chunks (AI SDK 4.x format)
    if (typedChunk.type === 'reasoning' && typedChunk.text) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          const reasoningPart = last.parts.find((p) => p.type === 'reasoning');

          let newParts: MessagePart[];
          if (reasoningPart) {
            newParts = last.parts.map((p) =>
              p.type === 'reasoning' ? { ...p, text: typedChunk.text! } : p
            );
          } else {
            newParts = [
              { type: 'reasoning' as const, text: typedChunk.text! },
              ...last.parts,
            ];
          }

          return [...prev.slice(0, -1), { ...last, parts: newParts }];
        }
        return prev;
      });
    }

    // Handle tool-call chunks
    if (typedChunk.type === 'tool-call') {
      const toolChunk = chunk as {
        type: 'tool-call';
        toolName: string;
        toolCallId: string;
        args?: unknown;
      };
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          // Add tool call part with toolCallId for later matching
          const toolCallPart: ToolCallPart = {
            type: 'tool-call',
            toolCallId: toolChunk.toolCallId,
            toolName: toolChunk.toolName,
            status: 'running',
            args: toolChunk.args,
          };

          return [
            ...prev.slice(0, -1),
            { ...last, parts: [...last.parts, toolCallPart] },
          ];
        }
        return prev;
      });
    }

    // Handle tool-result chunks
    if (typedChunk.type === 'tool-result') {
      const resultChunk = chunk as {
        type: 'tool-result';
        toolCallId: string;
        toolName?: string;
        input?: unknown;
        output?: unknown; // AI SDK uses 'output' not 'result'
      };
      console.warn(
        '[useAgent] Tool result received:',
        resultChunk.toolCallId,
        resultChunk.output
      );
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          // Update tool call status to completed - match by toolCallId
          const newParts = last.parts.map((p) => {
            if (
              p.type === 'tool-call' &&
              p.toolCallId === resultChunk.toolCallId
            ) {
              return {
                ...p,
                status: 'completed' as const,
                args: resultChunk.input ?? p.args, // Update args if provided
                result: resultChunk.output,
              };
            }
            return p;
          });

          return [...prev.slice(0, -1), { ...last, parts: newParts }];
        }
        return prev;
      });
    }

    // Handle tool-error chunks
    if (typedChunk.type === 'tool-error') {
      const errorChunk = chunk as {
        type: 'tool-error';
        toolCallId?: string;
        error?: string;
      };
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          // Update tool call status to error - match by toolCallId if available
          const newParts = last.parts.map((p) => {
            if (
              p.type === 'tool-call' &&
              (errorChunk.toolCallId
                ? p.toolCallId === errorChunk.toolCallId
                : p.status === 'running')
            ) {
              return {
                ...p,
                status: 'error' as const,
                error: errorChunk.error || 'Tool execution failed',
              };
            }
            return p;
          });

          return [...prev.slice(0, -1), { ...last, parts: newParts }];
        }
        return prev;
      });
    }

    // Handle stream error events (sent by main process when stream fails)
    if (typedChunk.type === 'error') {
      const errorChunk = chunk as {
        type: 'error';
        error?: unknown;
      };
      const errorValue = errorChunk.error;
      const errorMessage =
        typeof errorValue === 'string'
          ? errorValue
          : errorValue instanceof Error
            ? errorValue.message
            : 'An error occurred';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  /**
   * Refresh settings from main process
   */
  const refreshSettings = useCallback(async () => {
    try {
      const response = await sqlProAPI.agent.getSettings();
      setSettings(response.settings);
      setIsConfigured(response.isConfigured);
    } catch (err) {
      console.error('Failed to load agent settings:', err);
    }
  }, []);

  /**
   * Load sessions for current connection
   */
  const loadSessions = useCallback(async () => {
    if (!connectionId) return;

    try {
      const response = await sqlProAPI.agent.getSessions({ connectionId });
      setSessions(response.sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [connectionId]);

  // Load settings on mount
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // Load sessions when connectionId changes
  useEffect(() => {
    if (connectionId) {
      loadSessions();
    }
  }, [connectionId, loadSessions]);

  // Setup stream listener
  useEffect(() => {
    const streamId = `${connectionId}:${currentSessionId}`;
    const cleanup = sqlProAPI.agent.onChatStream(streamId, (chunk) => {
      // Handle streaming chunks from main process
      // The chunk follows Vercel AI SDK stream format
      handleStreamChunk(chunk);
    });

    streamCleanupRef.current = cleanup;

    return () => {
      cleanup();
    };
  }, [connectionId, currentSessionId, handleStreamChunk]);

  /**
   * Save settings
   */
  const saveSettings = useCallback(
    async (newSettings: Partial<AgentSettings>) => {
      try {
        const response = await sqlProAPI.agent.saveSettings({
          settings: newSettings,
        });
        setSettings(response.settings);
        setIsConfigured(true);
      } catch (err) {
        console.error('Failed to save agent settings:', err);
        throw err;
      }
    },
    []
  );

  /**
   * Load a specific session
   */
  const loadSession = useCallback(
    async (sessionId: string) => {
      if (!connectionId) return;

      try {
        const response = await sqlProAPI.agent.getSession({
          connectionId,
          sessionId,
        });
        if (response.session) {
          setMessages(response.session.messages.map(toSimpleMessage));
          setCurrentSessionId(sessionId);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    },
    [connectionId]
  );

  /**
   * Create a new session
   */
  const createNewSession = useCallback(() => {
    const newSessionId = generateSessionId();
    setCurrentSessionId(newSessionId);
    setMessages([]);
    setError(null);
    return newSessionId;
  }, []);

  /**
   * Delete a session
   */
  const deleteSession = useCallback(
    async (sessionId: string) => {
      if (!connectionId) return;

      try {
        await sqlProAPI.agent.deleteSession({ connectionId, sessionId });
        await loadSessions();

        // If deleted current session, create new one
        if (sessionId === currentSessionId) {
          createNewSession();
        }
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    },
    [connectionId, currentSessionId, loadSessions, createNewSession]
  );

  /**
   * Send a message to the agent
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!connectionId || !isConfigured) {
        setError('Agent not configured');
        return;
      }

      setError(null);
      setIsLoading(true);
      abortRef.current = false;

      // Add user message
      const userMessage: SimpleMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        parts: [{ type: 'text', text: content }],
      };

      // Add placeholder assistant message for streaming
      const assistantMessage: SimpleMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: '' }],
      };

      const newMessages = [...messages, userMessage, assistantMessage];
      setMessages(newMessages);

      try {
        // Convert to UIMessage format for IPC
        const uiMessages = newMessages.slice(0, -1).map(toUIMessage);

        const response: ChatSendResponse = await sqlProAPI.agent.sendChat({
          connectionId,
          sessionId: currentSessionId,
          messages: uiMessages,
        });

        if (!response.success) {
          setError(response.error || 'Chat failed');
          // Remove placeholder on error
          setMessages((prev) => prev.slice(0, -1));
        } else {
          // Update with final response - preserve streaming parts (tool calls, reasoning)
          // Only update the text part with final text
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === 'assistant') {
              const existingParts = updated[lastIdx].parts;
              // Update or add text part with final text
              const hasTextPart = existingParts.some((p) => p.type === 'text');
              const newParts = hasTextPart
                ? existingParts.map((p) =>
                    p.type === 'text' ? { ...p, text: response.text || '' } : p
                  )
                : [
                    ...existingParts,
                    { type: 'text' as const, text: response.text || '' },
                  ];

              updated[lastIdx] = {
                ...updated[lastIdx],
                parts: newParts,
              };
            }
            return updated;
          });

          // Refresh sessions list
          await loadSessions();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Chat failed');
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [connectionId, isConfigured, messages, currentSessionId, loadSessions]
  );

  /**
   * Cancel ongoing chat
   */
  const cancelChat = useCallback(async () => {
    if (!connectionId) return;

    abortRef.current = true;
    try {
      await sqlProAPI.agent.cancelChat({
        connectionId,
        sessionId: currentSessionId,
      });
    } catch (err) {
      console.error('Failed to cancel chat:', err);
    } finally {
      setIsLoading(false);
    }
  }, [connectionId, currentSessionId]);

  /**
   * Clear messages in current session
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Retry last failed message
   * Removes the failed assistant message and resends the last user message
   */
  const reload = useCallback(async () => {
    // Find the last user message
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === 'user');
    if (!lastUserMessage) return;

    // Get the text content from the user message
    const textPart = lastUserMessage.parts.find((p) => p.type === 'text');
    if (!textPart?.text) return;

    // Remove messages after (and including) the failed assistant message
    // Keep messages up to and including the last user message's index
    const lastUserIndex = messages.findIndex(
      (m) => m.id === lastUserMessage.id
    );
    setMessages(messages.slice(0, lastUserIndex));
    setError(null);

    // Resend the message
    await sendMessage(textPart.text);
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    error,
    settings,
    isConfigured,
    sessions,
    sendMessage,
    cancelChat,
    clearMessages,
    clearError,
    reload,
    loadSession,
    createNewSession,
    deleteSession,
    refreshSettings,
    saveSettings,
  };
}
