// AI Agent Dialog
// Floating chat dialog for SQL Pro AI Agent

import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Bot,
  Loader2,
  Plus,
  Send,
  Settings,
  Square,
  Trash2,
  User,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAgent } from '@/hooks/useAgent';
import { cn } from '@/lib/utils';
import { AgentSettingsPanel } from './AgentSettingsPanel';
import { MessageContent } from './MessageContent';

interface AIAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectionId: string;
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

export function AIAgentDialog({
  open,
  onOpenChange,
  connectionId,
}: AIAgentDialogProps) {
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

  // Focus input when dialog opens
  useEffect(() => {
    if (!open || !inputRef.current) {
      return;
    }
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [open]);

  // Show settings if not configured - use key to remount when dialog opens
  const shouldShowSettings = open && !isConfigured;

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

  if (showSettings || shouldShowSettings) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div
            className="mb-4 font-medium"
            style={{ fontSize: 'calc(var(--font-ui-size, 14px) * 1.15)' }}
          >
            {t('agent.settings.title', 'Agent Settings')}
          </div>
          <AgentSettingsPanel
            settings={settings}
            onSave={async (newSettings) => {
              await saveSettings(newSettings);
              setShowSettings(false);
            }}
            onCancel={() => {
              if (isConfigured) {
                setShowSettings(false);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[600px] max-w-3xl flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="text-primary h-5 w-5" />
            <span className="font-medium">
              {t('agent.title', 'SQL Pro Agent')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={createNewSession}
              title={t('agent.newSession', 'New Session')}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              title={t('agent.clearChat', 'Clear Chat')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
              title={t('agent.settings.title', 'Settings')}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                <Bot className="mb-4 h-12 w-12 opacity-50" />
                <p style={{ fontSize: 'var(--font-ui-size, 14px)' }}>
                  {t(
                    'agent.welcome',
                    'Ask me anything about your database. I can execute queries, analyze data, and suggest optimizations.'
                  )}
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <div className="bg-primary/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                    <Bot className="text-primary h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    'rounded-base max-w-[80%] px-4 py-2',
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.role === 'user' ? (
                    <div
                      className="whitespace-pre-wrap"
                      style={{ fontSize: 'var(--font-ui-size, 14px)' }}
                    >
                      {getMessageText(message)}
                    </div>
                  ) : (
                    <MessageContent parts={message.parts || []} />
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading &&
              messages.length > 0 &&
              getMessageText(messages[messages.length - 1]) === '' && (
                <div className="text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span style={{ fontSize: 'var(--font-ui-size, 14px)' }}>
                    {t('agent.thinking', 'Thinking...')}
                  </span>
                </div>
              )}
          </div>
        </ScrollArea>

        {/* Error */}
        {error && (
          <div className="bg-destructive/10 border-t px-4 py-2">
            <p
              className="text-destructive"
              style={{ fontSize: 'var(--font-ui-size, 14px)' }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t p-4">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder={t('agent.placeholder', 'Ask about your data...')}
              disabled={isLoading || !isConfigured}
              className="flex-1"
            />
            {isLoading ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={cancelChat}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || !isConfigured}
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
