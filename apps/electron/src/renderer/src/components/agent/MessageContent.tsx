// Message Content Renderer
// Renders AI message parts following Vercel AI Elements patterns
// Supports text, reasoning, tool-call, and streaming states

import type { ComponentPropsWithoutRef } from 'react';
import {
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  Loader2,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

// ============ Types ============

interface MessagePart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  status?: 'pending' | 'running' | 'completed' | 'error';
  args?: unknown;
  result?: unknown;
  input?: unknown;
  output?: unknown;
  error?: string;
}

interface MessageContentProps {
  parts: MessagePart[];
  className?: string;
  /** Whether this message is currently streaming */
  isStreaming?: boolean;
}

// ============ Markdown Components ============

const markdownComponents: ComponentPropsWithoutRef<
  typeof Markdown
>['components'] = {
  h1: ({ children, ...props }) => (
    <h1 className="mb-2 text-lg font-semibold" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-2 text-base font-semibold" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-1 text-sm font-medium" {...props}>
      {children}
    </h3>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="mb-2 ml-4 list-disc space-y-1" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-1" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="bg-muted rounded-md px-1 py-0.5 font-mono text-xs"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <code className={cn('block', className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre
      className="bg-muted my-2 overflow-x-auto rounded-md p-3 font-mono text-xs"
      {...props}
    >
      {children}
    </pre>
  ),
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      className="text-primary underline hover:no-underline"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-muted-foreground/30 my-2 border-l-2 pl-3 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="min-w-full border-collapse text-sm" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="bg-muted border px-2 py-1 text-left font-medium" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border px-2 py-1" {...props}>
      {children}
    </td>
  ),
  hr: (props) => <hr className="border-muted my-3" {...props} />,
  strong: ({ children, ...props }) => (
    <strong className="font-semibold" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }) => (
    <em className="italic" {...props}>
      {children}
    </em>
  ),
};

// ============ Shimmer Loader Component ============

/**
 * Shimmer loading indicator for streaming state
 * Following AI Elements Loader pattern
 */
function Shimmer({ className }: { className?: string }) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex items-center gap-2 py-1', className)}>
      <div className="flex gap-1">
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--gold)]"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--gold)]"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--gold)]"
          style={{ animationDelay: '300ms' }}
        />
      </div>
      <span className="text-muted-foreground text-xs">
        {t('agent.thinking', 'Thinking...')}
      </span>
    </div>
  );
}

// ============ Reasoning Component ============

/**
 * Collapsible reasoning block component
 * Following AI Elements Reasoning pattern with trigger and content
 */
interface ReasoningProps {
  text: string;
  isStreaming?: boolean;
  className?: string;
}

function Reasoning({ text, isStreaming, className }: ReasoningProps) {
  const { t } = useTranslation();
  // Auto-expand while streaming, collapse when done
  const [isExpanded, setIsExpanded] = useState(isStreaming ?? false);

  const lineCount = text.split('\n').filter((line) => line.trim()).length;

  return (
    <div
      className={cn(
        'my-2 rounded-lg border border-[var(--gold-muted)]/30 bg-[var(--gold-subtle)]',
        isStreaming && 'border-[var(--gold)]/50',
        className
      )}
    >
      {/* ReasoningTrigger */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-[var(--gold)]/5"
      >
        {isExpanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-[var(--gold)]" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-[var(--gold)]" />
        )}
        <Brain className="h-3.5 w-3.5 text-[var(--gold)]" />
        <span className="font-medium text-[var(--gold)]">
          {t('agent.reasoningTitle', 'Thinking')}
        </span>
        {isStreaming && (
          <Loader2 className="ml-1 h-3 w-3 animate-spin text-[var(--gold)]" />
        )}
        {!isExpanded && !isStreaming && (
          <span className="text-muted-foreground ml-auto text-[10px]">
            {t('agent.reasoningLines', '{{count}} lines', { count: lineCount })}
          </span>
        )}
      </button>
      {/* ReasoningContent */}
      {isExpanded && (
        <div className="text-muted-foreground border-t border-[var(--gold-muted)]/20 px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap">
          {text}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-[var(--gold)]" />
          )}
        </div>
      )}
    </div>
  );
}

// ============ Tool Call Component ============

/**
 * Format tool output based on tool type
 */
function formatToolOutput(
  toolName: string | undefined,
  output: unknown
): React.ReactNode {
  if (!output || typeof output !== 'object') {
    return (
      <pre className="bg-muted mt-1 max-h-64 overflow-auto rounded p-2 font-mono whitespace-pre-wrap">
        {JSON.stringify(output, null, 2)}
      </pre>
    );
  }

  const data = output as Record<string, unknown>;

  // Handle error responses
  if (data.success === false && data.error) {
    return (
      <div className="mt-1 text-red-500">
        <span className="font-medium">Error:</span> {String(data.error)}
      </div>
    );
  }

  // Format get_schema output
  if (toolName === 'get_schema' && data.success && data.data) {
    const schemaData = data.data as {
      tables?: Array<{
        name: string;
        columns?: Array<{
          name: string;
          type: string;
          nullable?: boolean;
          isPrimaryKey?: boolean;
        }>;
      }>;
    };
    const tables = schemaData.tables || [];
    return (
      <div className="mt-1 space-y-2">
        <div className="text-muted-foreground">
          Found{' '}
          <span className="text-foreground font-medium">{tables.length}</span>{' '}
          tables
        </div>
        {tables.map((table) => (
          <div key={table.name} className="bg-muted rounded p-2">
            <div className="text-foreground mb-1 font-medium">{table.name}</div>
            <div className="space-y-0.5">
              {table.columns?.map((col) => (
                <div
                  key={col.name}
                  className="text-muted-foreground flex items-center gap-2"
                >
                  <span
                    className={cn(
                      'font-mono',
                      col.isPrimaryKey && 'text-yellow-500'
                    )}
                  >
                    {col.name}
                  </span>
                  <span className="bg-background/50 rounded px-1 text-xs">
                    {col.type}
                  </span>
                  {col.isPrimaryKey && (
                    <span className="text-xs text-yellow-500">PK</span>
                  )}
                  {col.nullable === false && (
                    <span className="text-xs text-blue-500">NOT NULL</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Format execute_sql output
  if (toolName === 'execute_sql' && data.success) {
    const rows = data.data as unknown[] | undefined;
    const rowCount = data.rowCount as number | undefined;
    const executionTime = data.executionTime as number | undefined;

    return (
      <div className="mt-1 space-y-2">
        <div className="text-muted-foreground flex items-center gap-3">
          {rowCount !== undefined && (
            <span>
              <span className="text-foreground font-medium">{rowCount}</span>{' '}
              rows
            </span>
          )}
          {executionTime !== undefined && (
            <span>
              <span className="text-foreground font-medium">
                {executionTime}
              </span>
              ms
            </span>
          )}
        </div>
        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr>
                  {Object.keys(rows[0] as object).map((key) => (
                    <th
                      key={key}
                      className="bg-muted border px-2 py-1 text-left font-medium"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* eslint-disable react/no-array-index-key -- Table rows have no stable unique ID */}
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row as object).map((val, j) => (
                      <td key={j} className="border px-2 py-1 font-mono">
                        {val === null ? (
                          <span className="text-muted-foreground italic">
                            NULL
                          </span>
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {/* eslint-enable react/no-array-index-key */}
              </tbody>
            </table>
            {rows.length > 10 && (
              <div className="text-muted-foreground mt-1 text-center">
                ... and {rows.length - 10} more rows
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Format explain_query output
  if (toolName === 'explain_query' && data.success && data.plan) {
    return (
      <div className="mt-1">
        <pre className="bg-muted max-h-48 overflow-auto rounded p-2 font-mono text-xs whitespace-pre-wrap">
          {typeof data.plan === 'string'
            ? data.plan
            : JSON.stringify(data.plan, null, 2)}
        </pre>
      </div>
    );
  }

  // Format analyze_table output
  if (toolName === 'analyze_table' && data.success && data.data) {
    const tableData = data.data as {
      tableName?: string;
      totalRows?: number;
      columns?: Record<string, unknown>;
    };
    return (
      <div className="mt-1 space-y-2">
        <div className="text-muted-foreground">
          Table{' '}
          <span className="text-foreground font-medium">
            {tableData.tableName}
          </span>
          :{' '}
          <span className="text-foreground font-medium">
            {tableData.totalRows}
          </span>{' '}
          rows
        </div>
        {tableData.columns && (
          <div className="space-y-1">
            {Object.entries(tableData.columns).map(([colName, stats]) => {
              const colStats = stats as {
                type?: string;
                nullPercentage?: string;
                distinctValues?: number;
              };
              return (
                <div
                  key={colName}
                  className="bg-muted flex items-center gap-3 rounded p-2"
                >
                  <span className="font-mono font-medium">{colName}</span>
                  <span className="bg-background/50 rounded px-1 text-xs">
                    {colStats.type}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {colStats.distinctValues} distinct,{' '}
                    {colStats.nullPercentage} null
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Default: JSON output
  return (
    <pre className="bg-muted mt-1 max-h-64 overflow-auto rounded p-2 font-mono text-xs whitespace-pre-wrap">
      {JSON.stringify(output, null, 2)}
    </pre>
  );
}

/**
 * Tool call block component
 * Following AI Elements pattern for tool invocations
 */
interface ToolCallProps {
  part: MessagePart;
  isStreaming?: boolean;
}

function ToolCall({ part, isStreaming }: ToolCallProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  const toolDisplayName = part.toolName?.replace(/_/g, ' ') || 'Tool';
  const isRunning = part.status === 'running' || part.status === 'pending';

  const statusConfig = {
    pending: {
      icon: <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />,
      text: t('agent.toolPending', 'Pending'),
      color: 'text-muted-foreground',
    },
    running: {
      icon: <Loader2 className="h-3 w-3 animate-spin text-blue-500" />,
      text: t('agent.toolRunning', 'Running...'),
      color: 'text-blue-500',
    },
    completed: {
      icon: <CheckCircle2 className="h-3 w-3 text-green-500" />,
      text: t('agent.toolCompleted', 'Completed'),
      color: 'text-green-500',
    },
    error: {
      icon: <XCircle className="h-3 w-3 text-red-500" />,
      text: t('agent.toolError', 'Error'),
      color: 'text-red-500',
    },
  };

  const status = statusConfig[part.status || 'pending'];

  return (
    <div
      className={cn(
        'bg-muted/50 my-2 rounded-md border',
        isRunning && isStreaming && 'border-blue-500/30'
      )}
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-muted-foreground hover:text-foreground flex w-full items-center gap-1.5 px-2 py-1.5 text-xs transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
        <Database className="h-3 w-3" />
        <span className="font-medium capitalize">{toolDisplayName}</span>
        <span className={cn('ml-auto flex items-center gap-1', status.color)}>
          {status.icon}
          <span className="text-xs">{status.text}</span>
        </span>
      </button>
      {isExpanded && (
        <div className="border-t px-3 py-2 text-xs">
          {/* Input/Args */}
          {((part.args !== undefined &&
            Object.keys(part.args as object).length > 0) ||
            (part.input !== undefined &&
              Object.keys(part.input as object).length > 0)) && (
            <div className="mb-2">
              <span className="text-muted-foreground font-medium">
                {t('agent.toolInput', 'Input')}:
              </span>
              <pre className="bg-muted mt-1 overflow-x-auto rounded p-2 font-mono">
                {JSON.stringify(part.args ?? part.input, null, 2)}
              </pre>
            </div>
          )}
          {/* Output/Result */}
          {(part.result !== undefined || part.output !== undefined) && (
            <div>
              <span className="text-muted-foreground font-medium">
                {t('agent.toolOutput', 'Output')}:
              </span>
              {formatToolOutput(part.toolName, part.result ?? part.output)}
            </div>
          )}
          {/* Error */}
          {part.error && (
            <div className="text-red-500">
              <span className="font-medium">
                {t('agent.toolError', 'Error')}:
              </span>{' '}
              {part.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============ Text Response Component ============

/**
 * Text response with markdown rendering
 * Following AI Elements MessageResponse pattern
 */
interface TextResponseProps {
  text: string;
  isStreaming?: boolean;
}

function TextResponse({ text, isStreaming }: TextResponseProps) {
  return (
    <div className="relative">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </Markdown>
      {isStreaming && (
        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[var(--gold)]" />
      )}
    </div>
  );
}

// ============ Main Component ============

/**
 * Renders message parts following Vercel AI Elements patterns
 * Handles text, reasoning, tool-call parts with streaming awareness
 */
export function MessageContent({
  parts,
  className,
  isStreaming = false,
}: MessageContentProps) {
  return (
    <div className={cn('text-sm', className)}>
      {parts.length === 0 && isStreaming && <Shimmer />}
      {/* eslint-disable react/no-array-index-key -- Parts have no stable unique ID */}
      {parts.map((part, index) => {
        const isLastPart = index === parts.length - 1;
        const partIsStreaming = isStreaming && isLastPart;

        switch (part.type) {
          case 'text':
            if (!part.text) {
              // Empty text part while streaming - show shimmer
              return partIsStreaming ? <Shimmer key={index} /> : null;
            }
            return (
              <TextResponse
                key={index}
                text={part.text}
                isStreaming={partIsStreaming}
              />
            );

          case 'reasoning':
            if (!part.text) return null;
            return (
              <Reasoning
                key={index}
                text={part.text}
                isStreaming={partIsStreaming}
              />
            );

          case 'tool-call':
            return (
              <ToolCall key={index} part={part} isStreaming={partIsStreaming} />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

// Export individual components for flexibility
export { Reasoning, Shimmer, TextResponse, ToolCall };
