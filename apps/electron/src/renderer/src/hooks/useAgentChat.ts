import type { AgentSettings, ChatSession } from '@shared/types/agent';
import type { UIMessage } from 'ai';
import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { IPCChatTransport } from '@/lib/ipc-chat-transport';

interface UseAgentChatOptions {
  connectionId: string;
  sessionId?: string;
}

interface UseAgentChatReturn {
  messages: UIMessage[];
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  error: Error | undefined;
  sendMessage: (text: string) => void;
  stop: () => void;
  setMessages: (messages: UIMessage[]) => void;
  clearError: () => void;

  settings: AgentSettings | null;
  isConfigured: boolean;
  sessions: ChatSession[];
  currentSessionId: string;
  createNewSession: () => string;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  saveSettings: (settings: Partial<AgentSettings>) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useAgentChat(options: UseAgentChatOptions): UseAgentChatReturn {
  const { connectionId } = options;

  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState(
    () => options.sessionId || generateSessionId()
  );

  const transportRef = useRef<IPCChatTransport | null>(null);

  const transport = useMemo(() => {
    const newTransport = new IPCChatTransport({
      connectionId,
      sessionId: currentSessionId,
    });
    transportRef.current = newTransport;
    return newTransport;
  }, [connectionId, currentSessionId]);

  const {
    messages,
    status,
    error,
    sendMessage: sdkSendMessage,
    stop,
    setMessages,
    clearError,
  } = useChat({
    id: currentSessionId,
    transport,
  });

  const sendMessage = useCallback(
    (text: string) => {
      sdkSendMessage({ text });
    },
    [sdkSendMessage]
  );

  const refreshSettings = useCallback(async () => {
    try {
      const response = await window.sqlPro.agent.getSettings();
      setSettings(response.settings);
      setIsConfigured(response.isConfigured);
    } catch (err) {
      console.error('Failed to load agent settings:', err);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    if (!connectionId) return;
    try {
      const response = await window.sqlPro.agent.getSessions({ connectionId });
      setSessions(response.sessions);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  }, [connectionId]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const createNewSession = useCallback(() => {
    const newId = generateSessionId();
    setCurrentSessionId(newId);
    setMessages([]);
    if (transportRef.current) {
      transportRef.current.setSessionId(newId);
    }
    return newId;
  }, [setMessages]);

  const loadSession = useCallback(
    async (sessionId: string) => {
      try {
        const response = await window.sqlPro.agent.getSession({
          connectionId,
          sessionId,
        });
        if (response.session) {
          setMessages(response.session.messages as UIMessage[]);
          setCurrentSessionId(sessionId);
          if (transportRef.current) {
            transportRef.current.setSessionId(sessionId);
          }
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      }
    },
    [connectionId, setMessages]
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      try {
        await window.sqlPro.agent.deleteSession({ connectionId, sessionId });
        await loadSessions();
        if (sessionId === currentSessionId) {
          createNewSession();
        }
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    },
    [connectionId, currentSessionId, loadSessions, createNewSession]
  );

  const saveSettings = useCallback(
    async (newSettings: Partial<AgentSettings>) => {
      try {
        const response = await window.sqlPro.agent.saveSettings({
          settings: newSettings,
        });
        setSettings(response.settings);
        setIsConfigured(true);
      } catch (err) {
        console.error('Failed to save settings:', err);
      }
    },
    []
  );

  return {
    messages,
    status,
    error,
    sendMessage,
    stop,
    setMessages,
    clearError,
    settings,
    isConfigured,
    sessions,
    currentSessionId,
    createNewSession,
    loadSession,
    deleteSession,
    saveSettings,
    refreshSettings,
  };
}
