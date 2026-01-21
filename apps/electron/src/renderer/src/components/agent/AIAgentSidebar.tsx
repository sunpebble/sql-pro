// AI Agent Sidebar
// Refined sidebar chat interface for SQL Pro AI Agent

import { Button } from '@sqlpro/ui/button';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  AlertCircle,
  Bot,
  ChevronRight,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Square,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAgent } from '@/hooks/useAgent';
import { cn } from '@/lib/utils';
import { AgentSettingsPanel } from './AgentSettingsPanel';
import { MessageContent } from './MessageContent';

interface AIAgentSidebarProps {
  connectionId: string;
  onClose: () => void;
}

/**
 * Extract text content from UIMessage parts
 */
function getMessageText(message: {
  parts?: Array<{ type: string; text?: string }>;
}): string {
  if (!message.parts) return '';
  return message.parts
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('');
}

export function AIAgentSidebar({ connectionId, onClose }: AIAgentSidebarProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  const {
    messages,
    isLoading,
    error,
    isConfigured,
    sendMessage,
    cancelChat,
    clearMessages,
    clearError,
    reload,
    createNewSession,
    saveSettings,
    settings,
  } = useAgent({ connectionId });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  // Show settings only on initial load if not configured
  // Use ref to ensure we only auto-show once, allowing manual toggle afterward
  useEffect(() => {
    if (settings === null || initializedRef.current) {
      // Still loading or already initialized
      return;
    }
    initializedRef.current = true;
    if (!isConfigured) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional one-time initialization
      setShowSettings(true);
    }
  }, [isConfigured, settings]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const message = input.trim();
      setInput('');
      await sendMessage(message);
    },
    [input, isLoading, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  // Settings view
  if (showSettings) {
    return (
      <div className="glass-gold flex h-full flex-col">
        {/* Header */}
        <div className="bg-gold-5 border-b border-[var(--gold-muted)]/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5">
                <Settings className="h-4 w-4 text-[var(--gold)]" />
              </div>
              <span className="text-sm font-medium">
                {t('agent.settings', 'Agent Settings')}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="btn-gold-ghost h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings Content */}
        <ScrollArea className="flex-1 p-4">
          <AgentSettingsPanel
            settings={settings}
            onSave={async (newSettings) => {
              await saveSettings(newSettings);
              setShowSettings(false);
            }}
            onCancel={isConfigured ? () => setShowSettings(false) : undefined}
          />
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="glass-gold flex h-full flex-col">
      {/* Header - Gold accent bar */}
      <div className="bg-gold-5 border-b border-[var(--gold-muted)]/20 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--gold)]/20 via-[var(--gold)]/10 to-transparent shadow-sm">
              <Sparkles className="h-4 w-4 text-[var(--gold)]" />
              <div className="absolute inset-0 rounded-xl bg-[var(--gold)]/10 blur-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                {t('agent.title', 'SQL Pro Agent')}
              </span>
              <span className="text-[10px] text-[var(--gold-muted)]">
                {t('agent.subtitle', 'AI-powered database assistant')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="btn-gold-ghost h-7 w-7 rounded-lg"
              onClick={createNewSession}
              title={t('agent.newSession', 'New Session')}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="btn-gold-ghost h-7 w-7 rounded-lg"
              onClick={clearMessages}
              title={t('agent.clearChat', 'Clear Chat')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="btn-gold-ghost h-7 w-7 rounded-lg"
              onClick={() => setShowSettings(true)}
              title={t('agent.settings', 'Settings')}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <div className="mx-1 h-4 w-px bg-[var(--gold-muted)]/30" />
            <Button
              variant="ghost"
              size="icon"
              className="btn-gold-ghost h-7 w-7 rounded-lg"
              onClick={onClose}
              title={t('common.close', 'Close')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="space-y-3 p-3">
          {/* Empty State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--gold)]/15 via-[var(--gold)]/8 to-transparent">
                <Bot className="h-8 w-8 text-[var(--gold)]/70" />
              </div>
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                {t('agent.welcomeTitle', 'How can I help?')}
              </p>
              <p className="text-muted-foreground/70 max-w-[200px] text-xs leading-relaxed">
                {t(
                  'agent.welcomeDescription',
                  'Ask me to query data, analyze schemas, or optimize your database.'
                )}
              </p>
              {/* Quick Actions */}
              <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                {[
                  {
                    label: t('agent.quickAction.schema', 'Show schema'),
                    query: t(
                      'agent.quickAction.schemaQuery',
                      'Show me the database schema'
                    ),
                  },
                  {
                    label: t('agent.quickAction.tables', 'List tables'),
                    query: t(
                      'agent.quickAction.tablesQuery',
                      'List all tables'
                    ),
                  },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      setInput(action.query);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full bg-[var(--gold-subtle)] px-2.5 py-1 text-[10px] font-medium text-[var(--gold-muted)] transition-colors hover:bg-[var(--gold)]/15 hover:text-[var(--gold)]"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((message, index) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {/* Assistant Avatar */}
              {message.role === 'assistant' && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--gold)]/20 to-[var(--gold)]/5">
                  <Bot className="h-3 w-3 text-[var(--gold)]" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2',
                  message.role === 'user'
                    ? 'rounded-br-sm bg-[var(--gold)]/90 text-[#1a1a1a]'
                    : 'bg-muted/70 rounded-tl-sm'
                )}
              >
                {message.role === 'user' ? (
                  <div className="text-[13px] leading-relaxed whitespace-pre-wrap">
                    {getMessageText(message)}
                  </div>
                ) : (
                  <MessageContent
                    parts={message.parts || []}
                    className="text-[13px] leading-relaxed"
                    isStreaming={isLoading && index === messages.length - 1}
                  />
                )}
              </div>

              {/* User Avatar */}
              {message.role === 'user' && (
                <div className="bg-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
                  <User className="text-muted-foreground h-3 w-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Error Display - Enhanced with retry capability */}
      {error && (
        <div className="border-t border-red-500/20 bg-red-500/5 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-red-500">
                {t('agent.errorTitle', 'Something went wrong')}
              </p>
              <p className="mt-0.5 text-xs text-red-400/80">{error}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                onClick={() => reload()}
                title={t('agent.retry', 'Retry')}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-500 hover:bg-red-500/10 hover:text-red-400"
                onClick={clearError}
                title={t('common.close', 'Close')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area - Gold themed */}
      <form
        onSubmit={handleSubmit}
        className="bg-gold-5 border-t border-[var(--gold-muted)]/20 p-3"
      >
        <div className="flex items-center gap-2 rounded-xl bg-[var(--background)]/80 px-3 py-2 ring-1 ring-[var(--gold-muted)]/30 transition-all focus-within:ring-2 focus-within:ring-[var(--gold)]/40">
          <input
            ref={inputRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={t('agent.placeholder', 'Ask about your data...')}
            disabled={isLoading || !isConfigured}
            className="h-8 flex-1 bg-transparent text-sm outline-none placeholder:text-xs placeholder:text-[var(--muted-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-lg text-[var(--gold)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)]"
              onClick={cancelChat}
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim() || !isConfigured}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--gold)] text-[#1a1a1a] transition-all hover:bg-[var(--gold-bright)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-2 text-center text-[10px] text-[var(--gold-muted)]/70">
          {t(
            'agent.disclaimer',
            'AI may make mistakes. Verify important queries.'
          )}
        </p>
      </form>
    </div>
  );
}
