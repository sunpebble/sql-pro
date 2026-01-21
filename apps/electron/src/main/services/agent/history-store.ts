// Agent History Store
// Manages chat session history per connection

import type { ChatSession } from '@shared/types/agent';
import type { UIMessage } from 'ai';
import { randomUUID } from 'node:crypto';
import Store from 'electron-store';

interface HistorySchema {
  sessions: Record<string, ChatSession[]>; // keyed by connectionId
}

const historyStore = new Store<HistorySchema>({
  name: 'agent-history',
  defaults: {
    sessions: {},
  },
});

export const agentHistoryStore = {
  /**
   * Get all sessions for a connection
   */
  getSessions(connectionId: string): ChatSession[] {
    const sessions = historyStore.get('sessions');
    return sessions[connectionId] || [];
  },

  /**
   * Get a specific session
   */
  getSession(connectionId: string, sessionId: string): ChatSession | undefined {
    const sessions = this.getSessions(connectionId);
    return sessions.find((s) => s.id === sessionId);
  },

  /**
   * Create a new session
   */
  createSession(connectionId: string): ChatSession {
    const session: ChatSession = {
      id: randomUUID(),
      connectionId,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const sessions = historyStore.get('sessions');
    if (!sessions[connectionId]) {
      sessions[connectionId] = [];
    }
    sessions[connectionId].unshift(session);
    historyStore.set('sessions', sessions);

    return session;
  },

  /**
   * Update session messages
   */
  updateSession(
    connectionId: string,
    sessionId: string,
    messages: UIMessage[]
  ): void {
    const sessions = historyStore.get('sessions');
    const connectionSessions = sessions[connectionId] || [];
    const sessionIndex = connectionSessions.findIndex(
      (s) => s.id === sessionId
    );

    if (sessionIndex !== -1) {
      connectionSessions[sessionIndex] = {
        ...connectionSessions[sessionIndex],
        messages,
        updatedAt: Date.now(),
      };
      sessions[connectionId] = connectionSessions;
      historyStore.set('sessions', sessions);
    }
  },

  /**
   * Delete a session
   */
  deleteSession(connectionId: string, sessionId: string): void {
    const sessions = historyStore.get('sessions');
    if (sessions[connectionId]) {
      sessions[connectionId] = sessions[connectionId].filter(
        (s) => s.id !== sessionId
      );
      historyStore.set('sessions', sessions);
    }
  },

  /**
   * Clear all sessions for a connection
   */
  clearHistory(connectionId: string): void {
    const sessions = historyStore.get('sessions');
    delete sessions[connectionId];
    historyStore.set('sessions', sessions);
  },

  /**
   * Clear all history
   */
  clearAllHistory(): void {
    historyStore.set('sessions', {});
  },
};
