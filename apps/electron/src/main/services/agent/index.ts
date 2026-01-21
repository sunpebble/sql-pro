// Agent IPC Handlers
// Main entry point for AI Agent IPC communication

import type {
  AgentSettings,
  ChatSendResponse,
  GetHistoryResponse,
  GetSessionsResponse,
  GetSettingsResponse,
  SaveSettingsResponse,
} from '@shared/types/agent';
import type { UIMessage } from 'ai';
import { AGENT_IPC_CHANNELS } from '@shared/types/agent';
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

        try {
          for await (const chunk of result.fullStream) {
            if (abortController.signal.aborted) break;

            window?.webContents.send(
              `${AGENT_IPC_CHANNELS.CHAT_STREAM}:${streamId}`,
              chunk
            );
          }
        } catch (streamError) {
          // Send error event through stream so renderer can display it
          const errorMessage =
            streamError instanceof Error
              ? streamError.message
              : 'Stream processing failed';
          window?.webContents.send(
            `${AGENT_IPC_CHANNELS.CHAT_STREAM}:${streamId}`,
            { type: 'error', error: errorMessage }
          );
          throw streamError; // Re-throw to be caught by outer catch block
        }

        // Get final result - use response.messages which includes tool calls and results
        const text = await result.text;
        const response = await result.response;

        // Update history with new messages
        // Convert response messages to UIMessage format
        // UIMessage uses parts array with tool-call and tool-result types
        // convertToModelMessages will handle converting these back to proper API format
        const responseMessages = response.messages || [];
        const assistantParts: Array<{
          type: string;
          text?: string;
          toolCallId?: string;
          toolName?: string;
          args?: unknown;
          result?: unknown;
        }> = [];

        for (const msg of responseMessages) {
          if (msg.role === 'assistant' && Array.isArray(msg.content)) {
            for (const part of msg.content) {
              const p = part as {
                type: string;
                text?: string;
                toolCallId?: string;
                toolName?: string;
                input?: unknown;
              };
              if (p.type === 'text' && p.text) {
                assistantParts.push({ type: 'text', text: p.text });
              } else if (p.type === 'tool-call') {
                assistantParts.push({
                  type: 'tool-call',
                  toolCallId: p.toolCallId,
                  toolName: p.toolName,
                  args: p.input,
                });
              }
            }
          } else if (
            msg.role === 'assistant' &&
            typeof msg.content === 'string'
          ) {
            assistantParts.push({ type: 'text', text: msg.content });
          } else if (msg.role === 'tool' && Array.isArray(msg.content)) {
            // Tool results go into the same assistant message as tool-result parts
            for (const part of msg.content) {
              const p = part as {
                type: string;
                toolCallId?: string;
                toolName?: string;
                result?: unknown;
                output?: unknown;
              };
              if (p.type === 'tool-result') {
                assistantParts.push({
                  type: 'tool-result',
                  toolCallId: p.toolCallId,
                  toolName: p.toolName,
                  result: p.output ?? p.result,
                });
              }
            }
          }
        }

        // Create a single assistant UIMessage with all parts
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant' as const,
          content: text,
          parts:
            assistantParts.length > 0
              ? assistantParts
              : [{ type: 'text' as const, text }],
        };

        // Store messages - use type assertion since our simplified format is compatible
        // with what convertToModelMessages expects
        agentHistoryStore.updateSession(connectionId, sessionId, [
          ...messages,
          assistantMessage as unknown as UIMessage,
        ]);

        return { success: true, text, toolCalls: await result.toolCalls };
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
