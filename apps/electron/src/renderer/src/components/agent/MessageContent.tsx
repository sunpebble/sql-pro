// Message Content Renderer
// Renders AI message parts with Markdown support

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
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MessagePart {
  type: string;
  text?: string;
  toolCallId?: string;
  toolName?: string;
  status?: 'pending' | 'running' | 'completed' | 'error';
  args?: unknown; // Tool call arguments (AI SDK format)
  result?: unknown; // Tool call result (AI SDK format)
  // Legacy field names for backward compatibility
  input?: unknown;
  output?: unknown;
  error?: string;
}

interface MessageContentProps {
  parts: MessagePart[];
  className?: string;
}

/**
 * Custom components for Markdown rendering
 * Styled to match the chat UI aesthetics
 */
const markdownComponents: ComponentPropsWithoutRef<
  typeof Markdown
>['components'] = {
  // Headings
  h1: ({ children, ...props }) => (
    <h1 className="mb-2 text-lg font-bold" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mb-2 text-base font-bold" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mb-1 text-sm font-bold" {...props}>
      {children}
    </h3>
  ),

  // Paragraphs
  p: ({ children, ...props }) => (
    <p className="mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),

  // Lists
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

  // Inline code
  code: ({ children, className, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code
          className="bg-muted rounded px-1 py-0.5 font-mono text-xs"
          {...props}
        >
          {children}
        </code>
      );
    }
    // Code blocks
    return (
      <code className={cn('block', className)} {...props}>
        {children}
      </code>
    );
  },

  // Code blocks
  pre: ({ children, ...props }) => (
    <pre
      className="bg-muted my-2 overflow-x-auto rounded-md p-3 font-mono text-xs"
      {...props}
    >
      {children}
    </pre>
  ),

  // Links
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

  // Blockquotes
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="border-muted-foreground/30 my-2 border-l-2 pl-3 italic"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Tables
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

  // Horizontal rule
  hr: (props) => <hr className="border-muted my-3" {...props} />,

  // Strong and emphasis
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

/**
 * Collapsible reasoning block component
 */
function ReasoningBlock({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-muted/30 my-2 rounded-md border border-dashed">
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
        <Brain className="h-3 w-3" />
        <span className="font-medium">Thinking...</span>
      </button>
      {isExpanded && (
        <div className="text-muted-foreground border-t border-dashed px-3 py-2 text-xs whitespace-pre-wrap">
          {text}
        </div>
      )}
    </div>
  );
}

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
  // Structure: { success: true, data: { tables: [...], schemas: [...], views: [...] } }
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
      schemas?: unknown[];
      views?: unknown[];
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
  // Structure: { success: true, data: [...rows], rowCount: number, executionTime: number }
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
  // Structure: { success: true, plan: string | object }
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
  // Structure: { success: true, data: { tableName, totalRows, columns: {...} } }
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
 * Tool call status indicator
 */
function ToolCallBlock({ part }: { part: MessagePart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toolDisplayName = part.toolName?.replace(/_/g, ' ') || 'Tool';

  const statusIcon = {
    pending: <Loader2 className="text-muted-foreground h-3 w-3 animate-spin" />,
    running: <Loader2 className="h-3 w-3 animate-spin text-blue-500" />,
    completed: <CheckCircle2 className="h-3 w-3 text-green-500" />,
    error: <XCircle className="h-3 w-3 text-red-500" />,
  }[part.status || 'pending'];

  const statusText = {
    pending: 'Pending',
    running: 'Running...',
    completed: 'Completed',
    error: 'Error',
  }[part.status || 'pending'];

  return (
    <div className="bg-muted/50 my-2 rounded-md border">
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
        <span className="ml-auto flex items-center gap-1">
          {statusIcon}
          <span className="text-xs">{statusText}</span>
        </span>
      </button>
      {isExpanded && (
        <div className="border-t px-3 py-2 text-xs">
          {/* Support both args (new) and input (legacy) field names */}
          {((part.args !== undefined &&
            Object.keys(part.args as object).length > 0) ||
            (part.input !== undefined &&
              Object.keys(part.input as object).length > 0)) && (
            <div className="mb-2">
              <span className="text-muted-foreground font-medium">Input:</span>
              <pre className="bg-muted mt-1 overflow-x-auto rounded p-2 font-mono">
                {JSON.stringify(part.args ?? part.input, null, 2)}
              </pre>
            </div>
          )}
          {/* Support both result (new) and output (legacy) field names */}
          {(part.result !== undefined || part.output !== undefined) && (
            <div>
              <span className="text-muted-foreground font-medium">Output:</span>
              {formatToolOutput(part.toolName, part.result ?? part.output)}
            </div>
          )}
          {part.error && (
            <div className="text-red-500">
              <span className="font-medium">Error:</span> {part.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Renders message parts with Markdown support
 * Handles text parts and renders them with proper formatting
 */
export function MessageContent({ parts, className }: MessageContentProps) {
  return (
    <div className={cn('text-sm', className)}>
      {parts.map((part, index) => {
        if (part.type === 'text' && part.text) {
          return (
            <Markdown
              key={index}
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {part.text}
            </Markdown>
          );
        }

        // Handle reasoning part (thinking process)
        if (part.type === 'reasoning' && part.text) {
          return <ReasoningBlock key={index} text={part.text} />;
        }

        // Handle tool-call part
        if (part.type === 'tool-call') {
          return <ToolCallBlock key={index} part={part} />;
        }

        return null;
      })}
    </div>
  );
}
