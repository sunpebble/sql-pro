import type { UIMessage } from 'ai';
import type { ToolState } from '@/components/ui/ai/tool';
import { Bot, Copy, RefreshCw, User } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Action, Actions } from '@/components/ui/ai/actions';
import { Loader } from '@/components/ui/ai/loader';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ui/ai/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ui/ai/reasoning';
import { Response } from '@/components/ui/ai/response';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ui/ai/tool';

interface AgentMessageProps {
  message: UIMessage;
  isStreaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

interface ExtractedToolPart {
  type: string;
  toolCallId: string;
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
}

function extractToolParts(parts: UIMessage['parts']): ExtractedToolPart[] {
  if (!parts) return [];
  const result: ExtractedToolPart[] = [];
  for (const part of parts) {
    const p = part as unknown as Record<string, unknown>;
    if (
      typeof p.type === 'string' &&
      (p.type === 'dynamic-tool' || p.type.startsWith('tool-')) &&
      typeof p.toolCallId === 'string' &&
      typeof p.toolName === 'string' &&
      typeof p.state === 'string'
    ) {
      result.push({
        type: p.type,
        toolCallId: p.toolCallId as string,
        toolName: p.toolName as string,
        state: p.state as string,
        input: p.input,
        output: p.output,
      });
    }
  }
  return result;
}

function getToolState(state: string): ToolState {
  if (state === 'input-streaming' || state === 'partial-call')
    return 'input-streaming';
  if (state === 'input-available' || state === 'call') return 'input-available';
  if (state === 'output-available' || state === 'result')
    return 'output-available';
  if (state === 'output-error') return 'output-error';
  return 'output-streaming';
}

function formatToolOutput(output: unknown): string {
  if (typeof output === 'string') return output;
  return JSON.stringify(output, null, 2);
}

export const AgentMessage = memo(
  ({ message, isStreaming, onCopy, onRegenerate }: AgentMessageProps) => {
    const { t } = useTranslation();
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    const textContent = message.parts
      ?.filter(
        (p): p is { type: 'text'; text: string } =>
          p.type === 'text' && 'text' in p
      )
      .map((p) => p.text)
      .join('');

    const reasoningContent = message.parts
      ?.filter(
        (p): p is { type: 'reasoning'; text: string } =>
          p.type === 'reasoning' && 'text' in p
      )
      .map((p) => p.text)
      .join('');

    const toolParts = extractToolParts(message.parts);

    const hasContent = textContent || reasoningContent || toolParts.length > 0;
    const showLoader = isStreaming && !hasContent;

    return (
      <Message from={message.role}>
        {!isUser && (
          <MessageAvatar>
            <Bot className="h-4 w-4" />
          </MessageAvatar>
        )}

        <MessageContent>
          {reasoningContent && (
            <Reasoning isStreaming={isStreaming} defaultOpen={isStreaming}>
              <ReasoningTrigger title={t('agent.reasoning', 'Thinking')} />
              <ReasoningContent>{reasoningContent}</ReasoningContent>
            </Reasoning>
          )}

          {toolParts.map((part) => (
            <Tool key={part.toolCallId} defaultOpen={false}>
              <ToolHeader
                state={getToolState(part.state)}
                toolType={part.toolName}
              />
              <ToolContent>
                <ToolInput input={part.input} />
                {(part.state === 'result' ||
                  part.state === 'output-available') && (
                  <ToolOutput
                    output={
                      <Response>{formatToolOutput(part.output)}</Response>
                    }
                  />
                )}
              </ToolContent>
            </Tool>
          ))}

          {textContent ? (
            <Response>{textContent}</Response>
          ) : showLoader ? (
            <Loader />
          ) : null}

          {isAssistant && !isStreaming && (onCopy || onRegenerate) && (
            <Actions>
              {onCopy && (
                <Action tooltip={t('common.copy', 'Copy')} onClick={onCopy}>
                  <Copy className="size-4" />
                </Action>
              )}
              {onRegenerate && (
                <Action
                  tooltip={t('agent.regenerate', 'Regenerate')}
                  onClick={onRegenerate}
                >
                  <RefreshCw className="size-4" />
                </Action>
              )}
            </Actions>
          )}
        </MessageContent>

        {isUser && (
          <MessageAvatar>
            <User className="h-4 w-4" />
          </MessageAvatar>
        )}
      </Message>
    );
  }
);
