import type { ChatTransport, UIMessage, UIMessageChunk } from 'ai';

export interface IPCChatTransportOptions {
  connectionId: string;
  sessionId: string;
}

export class IPCChatTransport implements ChatTransport<UIMessage> {
  private connectionId: string;
  private sessionId: string;

  constructor(options: IPCChatTransportOptions) {
    this.connectionId = options.connectionId;
    this.sessionId = options.sessionId;
  }

  setSessionId(sessionId: string): void {
    this.sessionId = sessionId;
  }

  async sendMessages(options: {
    trigger: 'submit-message' | 'regenerate-message';
    chatId: string;
    messageId: string | undefined;
    messages: UIMessage[];
    abortSignal: AbortSignal | undefined;
  }): Promise<ReadableStream<UIMessageChunk>> {
    const { messages, abortSignal } = options;
    const streamId = `${this.connectionId}:${this.sessionId}`;

    return new ReadableStream<UIMessageChunk>({
      start: (controller) => {
        let cleanup: (() => void) | null = null;
        let isFinished = false;
        let currentTextId = '';
        let currentReasoningId = '';

        cleanup = window.sqlPro.agent.onChatStream(
          streamId,
          (chunk: unknown) => {
            if (isFinished) return;

            const typedChunk = chunk as {
              type?: string;
              text?: string;
              delta?: string;
              textDelta?: string;
              toolCallId?: string;
              toolName?: string;
              args?: unknown;
              input?: unknown;
              output?: unknown;
              result?: unknown;
              error?: unknown;
              finishReason?: string;
            };

            try {
              switch (typedChunk.type) {
                case 'text-delta': {
                  const delta =
                    typedChunk.text ||
                    typedChunk.delta ||
                    typedChunk.textDelta ||
                    '';
                  if (delta) {
                    if (!currentTextId) {
                      currentTextId = `text-${Date.now()}`;
                      controller.enqueue({
                        type: 'text-start',
                        id: currentTextId,
                      } as UIMessageChunk);
                    }
                    controller.enqueue({
                      type: 'text-delta',
                      id: currentTextId,
                      delta,
                    } as UIMessageChunk);
                  }
                  break;
                }

                case 'reasoning-delta':
                case 'reasoning': {
                  const delta = typedChunk.text || typedChunk.delta || '';
                  if (delta) {
                    if (!currentReasoningId) {
                      currentReasoningId = `reasoning-${Date.now()}`;
                      controller.enqueue({
                        type: 'reasoning-start',
                        id: currentReasoningId,
                      } as UIMessageChunk);
                    }
                    controller.enqueue({
                      type: 'reasoning-delta',
                      id: currentReasoningId,
                      delta,
                    } as UIMessageChunk);
                  }
                  break;
                }

                case 'tool-call': {
                  const toolId = typedChunk.toolCallId || `tool-${Date.now()}`;
                  controller.enqueue({
                    type: 'tool-input-available',
                    toolCallId: toolId,
                    toolName: typedChunk.toolName || '',
                    input: typedChunk.args || typedChunk.input || {},
                  } as UIMessageChunk);
                  break;
                }

                case 'tool-result': {
                  controller.enqueue({
                    type: 'tool-output-available',
                    toolCallId: typedChunk.toolCallId || '',
                    output: typedChunk.output || typedChunk.result || null,
                  } as UIMessageChunk);
                  break;
                }

                case 'error': {
                  const errorMessage =
                    typeof typedChunk.error === 'string'
                      ? typedChunk.error
                      : typedChunk.error instanceof Error
                        ? typedChunk.error.message
                        : 'Unknown error';
                  controller.enqueue({
                    type: 'error',
                    errorText: errorMessage,
                  } as UIMessageChunk);
                  break;
                }

                case 'finish': {
                  if (currentTextId) {
                    controller.enqueue({
                      type: 'text-end',
                      id: currentTextId,
                    } as UIMessageChunk);
                  }
                  if (currentReasoningId) {
                    controller.enqueue({
                      type: 'reasoning-end',
                      id: currentReasoningId,
                    } as UIMessageChunk);
                  }
                  controller.enqueue({
                    type: 'finish',
                    finishReason:
                      (typedChunk.finishReason as
                        | 'stop'
                        | 'length'
                        | 'content-filter'
                        | 'tool-calls'
                        | 'error'
                        | 'other'
                        | 'unknown') || 'stop',
                  } as UIMessageChunk);

                  isFinished = true;
                  try {
                    controller.close();
                  } catch {
                    /* already closed */
                  }
                  if (cleanup) {
                    cleanup();
                    cleanup = null;
                  }
                  break;
                }

                default:
                  break;
              }
            } catch (e) {
              console.error('[IPCChatTransport] Error processing chunk:', e);
            }
          }
        );

        window.sqlPro.agent
          .sendChat({
            connectionId: this.connectionId,
            sessionId: this.sessionId,
            messages,
          })
          .then((response) => {
            if (!response.success && !isFinished) {
              controller.enqueue({
                type: 'error',
                errorText: response.error || 'Chat request failed',
              } as UIMessageChunk);
              isFinished = true;
              try {
                controller.close();
              } catch {
                /* already closed */
              }
              if (cleanup) {
                cleanup();
                cleanup = null;
              }
            }
          })
          .catch((error) => {
            if (!isFinished) {
              controller.enqueue({
                type: 'error',
                errorText:
                  error instanceof Error ? error.message : 'IPC request failed',
              } as UIMessageChunk);
              isFinished = true;
              try {
                controller.close();
              } catch {
                /* already closed */
              }
              if (cleanup) {
                cleanup();
                cleanup = null;
              }
            }
          });

        abortSignal?.addEventListener('abort', () => {
          if (!isFinished) {
            isFinished = true;
            window.sqlPro.agent.cancelChat({
              connectionId: this.connectionId,
              sessionId: this.sessionId,
            });
            try {
              controller.close();
            } catch {
              /* already closed */
            }
            if (cleanup) {
              cleanup();
              cleanup = null;
            }
          }
        });
      },
    });
  }

  async reconnectToStream(
    _options: { chatId: string } & Record<string, unknown>
  ): Promise<ReadableStream<UIMessageChunk> | null> {
    return null;
  }
}
