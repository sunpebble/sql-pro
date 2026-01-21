// AI Agent Sidebar
// Refined sidebar chat interface for SQL Pro AI Agent

import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Bot,
  ChevronRight,
  Loader2,
  Plus,
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

  const {
    messages,
    isLoading,
    error,
    isConfigured,
    sendMessage,
    cancelChat,
    clearMessages,
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

  // Show settings if not configured
  useEffect(() => {
    if (!isConfigured) {
      // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional conditional show
      setShowSettings(true);
    }
  }, [isConfigured]);

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
      <div className="bg-background/95 flex h-full flex-col backdrop-blur-sm">
        {/* Header */}
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="from-primary/20 to-primary/5 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br">
                <Settings className="text-primary h-4 w-4" />
              </div>
              <span className="text-sm font-medium">
                {t('agent.settings', 'Agent Settings')}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
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
    <div className="bg-background/95 flex h-full flex-col backdrop-blur-sm">
      {/* Header - Refined glass effect */}
      <div className="from-muted/50 to-background border-b bg-gradient-to-b px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="from-primary/20 via-primary/10 relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br to-transparent shadow-sm">
              <Sparkles className="text-primary h-4 w-4" />
              <div className="bg-primary/20 absolute inset-0 rounded-xl blur-sm" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight">
                {t('agent.title', 'SQL Pro Agent')}
              </span>
              <span className="text-muted-foreground text-[10px]">
                {t('agent.subtitle', 'AI-powered database assistant')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={createNewSession}
              title={t('agent.newSession', 'New Session')}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={clearMessages}
              title={t('agent.clearChat', 'Clear Chat')}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => setShowSettings(true)}
              title={t('agent.settings', 'Settings')}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
            <div className="bg-border mx-1 h-4 w-px" />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
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
              <div className="from-primary/10 via-primary/5 mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br to-transparent">
                <Bot className="text-primary/60 h-8 w-8" />
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
                    query: 'Show me the database schema',
                  },
                  {
                    label: t('agent.quickAction.tables', 'List tables'),
                    query: 'List all tables',
                  },
                ].map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      setInput(action.query);
                      inputRef.current?.focus();
                    }}
                    className="bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message List */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex gap-2',
                message.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {/* Assistant Avatar */}
              {message.role === 'assistant' && (
                <div className="from-primary/15 to-primary/5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
                  <Bot className="text-primary h-3 w-3" />
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3 py-2',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
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

          {/* Loading Indicator */}
          {isLoading &&
            messages.length > 0 &&
            getMessageText(messages[messages.length - 1]) === '' && (
              <div className="flex items-center gap-2 px-1">
                <div className="from-primary/15 to-primary/5 flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br">
                  <Loader2 className="text-primary h-3 w-3 animate-spin" />
                </div>
                <span className="text-muted-foreground text-xs">
                  {t('agent.thinking', 'Thinking...')}
                </span>
              </div>
            )}
        </div>
      </ScrollArea>

      {/* Error Display */}
      {error && (
        <div className="bg-destructive/5 border-destructive/20 border-t px-3 py-2">
          <p className="text-destructive text-xs">{error}</p>
        </div>
      )}

      {/* Input Area - Refined */}
      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="bg-muted/50 focus-within:ring-primary/20 flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all focus-within:ring-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setInput(e.target.value)
            }
            onKeyDown={handleKeyDown}
            placeholder={t('agent.placeholder', 'Ask about your data...')}
            disabled={isLoading || !isConfigured}
            className="h-8 flex-1 border-0 bg-transparent px-0 text-sm shadow-none placeholder:text-xs focus-visible:ring-0"
          />
          {isLoading ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-lg"
              onClick={cancelChat}
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className="h-7 w-7 shrink-0 rounded-lg"
              disabled={!input.trim() || !isConfigured}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-muted-foreground/60 mt-1.5 text-center text-[10px]">
          {t(
            'agent.disclaimer',
            'AI may make mistakes. Verify important queries.'
          )}
        </p>
      </form>
    </div>
  );
}
