/**
 * Agent IPC Handler
 *
 * Handles AI Agent IPC communication including chat, settings, history,
 * and natural language query operations.
 */

import type {
  AgentSettings,
  ChatSendResponse,
  GetHistoryResponse,
  GetSessionsResponse,
  GetSettingsResponse,
  NLExplainSQLResponse,
  NLGenerateSQLResponse,
  NLOptimizeSQLResponse,
  SaveSettingsResponse,
} from '@shared/types/agent';
import type { UIMessage } from 'ai';
import type {HandlerContext} from '../base/handler';
import { AGENT_IPC_CHANNELS } from '@shared/types/agent';
import { BrowserWindow, ipcMain } from 'electron';
import { handleChat } from '../../services/agent/chat-handler';
import { agentHistoryStore } from '../../services/agent/history-store';
import {
  explainSQL,
  generateSQL,
  optimizeSQL,
} from '../../services/agent/nl-query-handler';
import { agentSettingsStore } from '../../services/agent/settings-store';
import {  IpcHandler } from '../base/handler';

// Track active chat streams for cancellation
const activeStreams = new Map<string, AbortController>();

export class AgentHandler extends IpcHandler {
  constructor() {
    super({ name: 'agent' });
  }

  register(): void {
    // Settings handlers
    this.handleLegacy(
      AGENT_IPC_CHANNELS.SETTINGS_GET,
      this.getSettings.bind(this)
    );
    this.handleLegacy(
      AGENT_IPC_CHANNELS.SETTINGS_SAVE,
      this.saveSettings.bind(this)
    );

    // History handlers
    this.handleLegacy(
      AGENT_IPC_CHANNELS.HISTORY_GET_SESSIONS,
      this.getSessions.bind(this)
    );
    this.handleLegacy(
      AGENT_IPC_CHANNELS.HISTORY_GET,
      this.getHistory.bind(this)
    );
    this.handleLegacy(
      AGENT_IPC_CHANNELS.HISTORY_DELETE_SESSION,
      this.deleteSession.bind(this)
    );
    this.handleLegacy(
      AGENT_IPC_CHANNELS.HISTORY_CLEAR,
      this.clearHistory.bind(this)
    );

    // Chat handler needs access to event.sender for streaming
    ipcMain.handle(AGENT_IPC_CHANNELS.CHAT_SEND, async (event, request) =>
      this.chatSend(event, request)
    );

    this.handleLegacy(
      AGENT_IPC_CHANNELS.CHAT_CANCEL,
      this.chatCancel.bind(this)
    );

    // Natural Language Query handlers
    this.handleLegacy(
      AGENT_IPC_CHANNELS.NL_GENERATE_SQL,
      this.generateSQL.bind(this)
    );
    this.handleLegacy(
      AGENT_IPC_CHANNELS.NL_EXPLAIN_SQL,
      this.explainSQL.bind(this)
    );
    this.handleLegacy(
      AGENT_IPC_CHANNELS.NL_OPTIMIZE_SQL,
      this.optimizeSQL.bind(this)
    );
  }

  cleanup(): void {
    // Abort all active streams
    for (const controller of activeStreams.values()) {
      controller.abort();
    }
    activeStreams.clear();

    // Remove the manually registered chat handler
    ipcMain.removeHandler(AGENT_IPC_CHANNELS.CHAT_SEND);

    super.cleanup();
  }

  // Settings handlers
  private async getSettings(
    _request: void,
    _ctx: HandlerContext
  ): Promise<GetSettingsResponse> {
    return {
      settings: agentSettingsStore.getSettings(),
      isConfigured: agentSettingsStore.isConfigured(),
    };
  }

  private async saveSettings(
    request: { settings: Partial<AgentSettings> },
    _ctx: HandlerContext
  ): Promise<SaveSettingsResponse> {
    const settings = agentSettingsStore.saveSettings(request.settings);
    return { settings };
  }

  // History handlers
  private async getSessions(
    request: { connectionId: string },
    _ctx: HandlerContext
  ): Promise<GetSessionsResponse> {
    const sessions = agentHistoryStore.getSessions(request.connectionId);
    return { sessions };
  }

  private async getHistory(
    request: { connectionId: string; sessionId: string },
    _ctx: HandlerContext
  ): Promise<GetHistoryResponse> {
    const session = agentHistoryStore.getSession(
      request.connectionId,
      request.sessionId
    );
    return { session };
  }

  private async deleteSession(
    request: { connectionId: string; sessionId: string },
    _ctx: HandlerContext
  ): Promise<Record<string, never>> {
    agentHistoryStore.deleteSession(request.connectionId, request.sessionId);
    return {};
  }

  private async clearHistory(
    request: { connectionId: string },
    _ctx: HandlerContext
  ): Promise<Record<string, never>> {
    agentHistoryStore.clearHistory(request.connectionId);
    return {};
  }

  // Chat handler with streaming
  private async chatSend(
    event: Electron.IpcMainInvokeEvent,
    request: {
      connectionId: string;
      sessionId: string;
      messages: UIMessage[];
    }
  ): Promise<ChatSendResponse> {
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
        const errorMessage =
          streamError instanceof Error
            ? streamError.message
            : 'Stream processing failed';
        window?.webContents.send(
          `${AGENT_IPC_CHANNELS.CHAT_STREAM}:${streamId}`,
          { type: 'error', error: errorMessage }
        );
        throw streamError;
      }

      // Get final result
      const text = await result.text;
      const response = await result.response;

      // Convert response messages to UIMessage format
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

      // Store messages
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

  private async chatCancel(
    request: { connectionId: string; sessionId: string },
    _ctx: HandlerContext
  ): Promise<Record<string, never>> {
    const streamId = `${request.connectionId}:${request.sessionId}`;
    const controller = activeStreams.get(streamId);
    if (controller) {
      controller.abort();
      activeStreams.delete(streamId);
    }
    return {};
  }

  // Natural Language Query handlers
  private async generateSQL(
    request: { connectionId: string; naturalLanguage: string },
    _ctx: HandlerContext
  ): Promise<NLGenerateSQLResponse> {
    const settings = agentSettingsStore.getSettings();

    if (!agentSettingsStore.isConfigured()) {
      return { success: false, error: 'Agent not configured' };
    }

    try {
      const result = await generateSQL({
        connectionId: request.connectionId,
        naturalLanguage: request.naturalLanguage,
        settings,
      });
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SQL generation failed',
      };
    }
  }

  private async explainSQL(
    request: { connectionId: string; sql: string },
    _ctx: HandlerContext
  ): Promise<NLExplainSQLResponse> {
    const settings = agentSettingsStore.getSettings();

    if (!agentSettingsStore.isConfigured()) {
      return { success: false, error: 'Agent not configured' };
    }

    try {
      const result = await explainSQL({
        connectionId: request.connectionId,
        sql: request.sql,
        settings,
      });
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'SQL explanation failed',
      };
    }
  }

  private async optimizeSQL(
    request: { connectionId: string; sql: string },
    _ctx: HandlerContext
  ): Promise<NLOptimizeSQLResponse> {
    const settings = agentSettingsStore.getSettings();

    if (!agentSettingsStore.isConfigured()) {
      return { success: false, error: 'Agent not configured' };
    }

    try {
      const result = await optimizeSQL({
        connectionId: request.connectionId,
        sql: request.sql,
        settings,
      });
      return { success: true, result };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'SQL optimization failed',
      };
    }
  }
}

// Export singleton instance
export const agentHandler = new AgentHandler();
