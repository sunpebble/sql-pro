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

// Simplified message type for internal use
interface SimpleMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{ type: 'text'; text: string }>;
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
  const text =
    msg.parts
      ?.filter(
        (p): p is { type: 'text'; text: string } =>
          p.type === 'text' && 'text' in p
      )
      .map((p) => p.text)
      .join('') || '';
  return {
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    parts: [{ type: 'text', text }],
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
   * Handle incoming stream chunks
   */
  const handleStreamChunk = useCallback((chunk: unknown) => {
    if (!chunk || typeof chunk !== 'object') return;

    const typedChunk = chunk as {
      type?: string;
      textDelta?: string;
      text?: string;
    };

    if (typedChunk.type === 'text-delta' && typedChunk.textDelta) {
      // Append text delta to the last assistant message
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          const currentText = last.parts[0]?.text || '';
          const newText = currentText + typedChunk.textDelta;
          return [
            ...prev.slice(0, -1),
            { ...last, parts: [{ type: 'text' as const, text: newText }] },
          ];
        }
        return prev;
      });
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
          // Update with final response
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]?.role === 'assistant') {
              updated[lastIdx] = {
                ...updated[lastIdx],
                parts: [{ type: 'text', text: response.text || '' }],
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
    loadSession,
    createNewSession,
    deleteSession,
    refreshSettings,
    saveSettings,
  };
}
