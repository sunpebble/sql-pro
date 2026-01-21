// Agent IPC Handlers
// Main entry point for AI Agent IPC communication

import type {AgentSettings, ChatSendResponse, GetHistoryResponse, GetSessionsResponse, GetSettingsResponse, SaveSettingsResponse} from '@shared/types/agent';
import type { UIMessage } from 'ai';
import {
  AGENT_IPC_CHANNELS
  
  
  
  
  
  
} from '@shared/types/agent';
import { BrowserWindow, ipcMain } from 'electron';
import { createHandler } from '../ipc/utils';
import { handleChat } from './chat-handler';
import { agentHistoryStore } from './history-store';
import { agentSettingsStore } from './settings-store';

// Track active chat streams for cancellation
const activeStreams = new Map<string, AbortController>();

export function setupAgentHandlers(): void {
  // Settings handlers
  ipcMain.handle(
    AGENT_IPC_CHANNELS.SETTINGS_GET,
    createHandler(async (): Promise<GetSettingsResponse> => {
      return {
        settings: agentSettingsStore.getSettings(),
        isConfigured: agentSettingsStore.isConfigured(),
      };
    })
  );

  ipcMain.handle(
    AGENT_IPC_CHANNELS.SETTINGS_SAVE,
    createHandler(
      async (request: {
        settings: Partial<AgentSettings>;
      }): Promise<SaveSettingsResponse> => {
        const settings = agentSettingsStore.saveSettings(request.settings);
        return { settings };
      }
    )
  );

  // History handlers
  ipcMain.handle(
    AGENT_IPC_CHANNELS.HISTORY_GET_SESSIONS,
    createHandler(
      async (request: {
        connectionId: string;
      }): Promise<GetSessionsResponse> => {
        const sessions = agentHistoryStore.getSessions(request.connectionId);
        return { sessions };
      }
    )
  );

  ipcMain.handle(
    AGENT_IPC_CHANNELS.HISTORY_GET,
    createHandler(
      async (request: {
        connectionId: string;
        sessionId: string;
      }): Promise<GetHistoryResponse> => {
        const session = agentHistoryStore.getSession(
          request.connectionId,
          request.sessionId
        );
        return { session };
      }
    )
  );

  ipcMain.handle(
    AGENT_IPC_CHANNELS.HISTORY_DELETE_SESSION,
    createHandler(
      async (request: {
        connectionId: string;
        sessionId: string;
      }): Promise<Record<string, never>> => {
        agentHistoryStore.deleteSession(
          request.connectionId,
          request.sessionId
        );
        return {};
      }
    )
  );

  ipcMain.handle(
    AGENT_IPC_CHANNELS.HISTORY_CLEAR,
    createHandler(
      async (request: {
        connectionId: string;
      }): Promise<Record<string, never>> => {
        agentHistoryStore.clearHistory(request.connectionId);
        return {};
      }
    )
  );

  // Chat handler with streaming
  ipcMain.handle(
    AGENT_IPC_CHANNELS.CHAT_SEND,
    async (
      event,
      request: {
        connectionId: string;
        sessionId: string;
        messages: UIMessage[];
      }
    ): Promise<ChatSendResponse> => {
      const { connectionId, sessionId, messages } = request;
      const settings = agentSettingsStore.getSettings();

      if (!agentSettingsStore.isConfigured()) {
        return { success: false, error: 'Agent not configured' };
      }

      // Create abort controller for this stream
      const streamId = `${connectionId}:${sessionId}`;
      const abortController = new AbortController();
      activeStreams.set(streamId, abortController);

      try {
        const result = await handleChat({
          connectionId,
          messages,
          settings,
          signal: abortController.signal,
        });

        // Stream chunks to renderer
        const window = BrowserWindow.fromWebContents(event.sender);

        for await (const chunk of result.fullStream) {
          if (abortController.signal.aborted) break;

          window?.webContents.send(
            `${AGENT_IPC_CHANNELS.CHAT_STREAM}:${streamId}`,
            chunk
          );
        }

        // Get final result
        const text = await result.text;
        const toolCalls = await result.toolCalls;

        // Update history with new messages
        // Create a simplified message format for storage
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: text,
          parts: [{ type: 'text' as const, text }],
        };
        agentHistoryStore.updateSession(connectionId, sessionId, [
          ...messages,
          assistantMessage,
        ]);

        return { success: true, text, toolCalls };
      } catch (error) {
        if (abortController.signal.aborted) {
          return { success: false, error: 'Chat cancelled' };
        }
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Chat failed',
        };
      } finally {
        activeStreams.delete(streamId);
      }
    }
  );

  // Cancel chat
  ipcMain.handle(
    AGENT_IPC_CHANNELS.CHAT_CANCEL,
    createHandler(
      async (request: {
        connectionId: string;
        sessionId: string;
      }): Promise<Record<string, never>> => {
        const streamId = `${request.connectionId}:${request.sessionId}`;
        const controller = activeStreams.get(streamId);
        if (controller) {
          controller.abort();
          activeStreams.delete(streamId);
        }
        return {};
      }
    )
  );
}

export function cleanupAgentHandlers(): void {
  // Abort all active streams
  activeStreams.forEach((controller) => controller.abort());
  activeStreams.clear();

  // Remove all handlers
  Object.values(AGENT_IPC_CHANNELS).forEach((channel) => {
    ipcMain.removeHandler(channel);
  });
}
