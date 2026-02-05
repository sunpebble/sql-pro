import type { UIMessage } from 'ai';
import { Button } from '@sqlpro/ui/button';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import {
  AlertCircle,
  Bot,
  ChevronRight,
  Clock,
  History,
  MessageSquare,
  Plus,
  Send,
  Settings,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useAgentChat } from '@/hooks/useAgentChat';
import { AgentMessage } from './AgentMessage';
import { AgentSettingsPanel } from './AgentSettingsPanel';

interface AIAgentSidebarProps {
  connectionId: string;
  databaseName?: string;
  tableName?: string;
  onClose: () => void;
}

function getMessageText(message: UIMessage): string {
  if (!message.parts) return '';
  return message.parts
    .filter(
      (part): part is { type: 'text'; text: string } =>
        part.type === 'text' && 'text' in part
    )
    .map((part) => part.text)
    .join('');
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function AIAgentSidebar({
  connectionId,
  databaseName,
  tableName,
  onClose,
}: AIAgentSidebarProps) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);

  const {
    messages,
    status,
    error,
    isConfigured,
    sessions,
    sendMessage,
    stop,
    setMessages,
    clearError,
    createNewSession,
    loadSession,
    deleteSession,
    saveSettings,
    settings,
  } = useAgentChat({ connectionId });

  const isLoading = status === 'streaming' || status === 'submitted';

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  });

  useEffect(() => {
    const timer = setTimeout(() => textareaRef.current?.focus(), 150);
    return () => clearTimeout(timer);
  }, []);

  // Compute whether to show settings without useEffect
  const shouldShowSettings =
    !initializedRef.current && settings !== null && !isConfigured;

  // Mark as initialized when settings panel would be shown
  if (shouldShowSettings && !initializedRef.current) {
    initializedRef.current = true;
  }

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, []);

  useLayoutEffect(() => {
    adjustTextareaHeight();
  });

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;

      const message = input.trim();
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
      sendMessage(message);
    },
    [input, isLoading, sendMessage]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSubmit(e);
      }
      if (e.key === 'Escape' && isLoading) {
        e.preventDefault();
        stop();
      }
    },
    [handleSubmit, isLoading, stop]
  );

  const handleCopyMessage = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const handleQuickAction = useCallback((query: string) => {
    setInput(query);
    textareaRef.current?.focus();
  }, []);

  const quickActions = [
    {
      label: t('agent.quickAction.schema', 'Show schema'),
      query: tableName
        ? t(
            'agent.quickAction.tableSchemaQuery',
            `Describe the structure of the ${tableName} table`
          )
        : t('agent.quickAction.schemaQuery', 'Show me the database schema'),
    },
    {
      label: t('agent.quickAction.tables', 'List tables'),
      query: t('agent.quickAction.tablesQuery', 'List all tables'),
    },
    {
      label: t('agent.quickAction.analyze', 'Analyze'),
      query: tableName
        ? t(
            'agent.quickAction.analyzeTableQuery',
            `Analyze the ${tableName} table - show row count, column types, and sample data`
          )
        : t(
            'agent.quickAction.analyzeDbQuery',
            'Analyze this database - summarize tables and their relationships'
          ),
    },
    {
      label: t('agent.quickAction.optimize', 'Optimize'),
      query: t(
        'agent.quickAction.optimizeQuery',
        'Suggest indexes and optimizations for this database'
      ),
    },
  ];

  if (showSettings || shouldShowSettings) {
    return (
      <div className="glass-gold bg-grid-dot flex h-full flex-col overflow-hidden outline-none">
        <div className="border-primary/10 mt-1 flex h-10 shrink-0 items-center justify-between border-b px-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/15 rounded-base flex h-7 w-7 items-center justify-center">
              <Settings className="text-primary h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              {t('agent.settings', 'Agent Settings')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 hover:text-primary rounded-base h-7 w-7"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

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

  if (showHistory) {
    return (
      <div className="glass-gold bg-grid-dot flex h-full flex-col overflow-hidden outline-none">
        <div className="border-primary/10 mt-1 flex h-10 shrink-0 items-center justify-between border-b px-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/15 rounded-base flex h-7 w-7 items-center justify-center">
              <History className="text-primary h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              {t('agent.history', 'Chat History')}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="hover:bg-primary/10 hover:text-primary rounded-base h-7 w-7"
            onClick={() => setShowHistory(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-primary/15 rounded-base mb-3 flex h-12 w-12 items-center justify-center">
                  <MessageSquare className="text-primary/50 h-6 w-6" />
                </div>
                <p className="text-muted-foreground text-sm">
                  {t('agent.noHistory', 'No chat history yet')}
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const sessionTitle =
                  session.messages[0]?.parts
                    ?.find((p) => p.type === 'text')
                    ?.text?.slice(0, 50) ||
                  t('agent.untitledSession', 'Untitled conversation');
                const messageCount = session.messages.length;
                return (
                  <button
                    type="button"
                    key={session.id}
                    className="group hover:bg-primary/10 rounded-base flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors"
                    onClick={() => {
                      loadSession(session.id);
                      setShowHistory(false);
                    }}
                  >
                    <MessageSquare className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0 transition-colors" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{sessionTitle}</p>
                      <div className="text-muted-foreground flex items-center gap-2 text-xs">
                        <Clock className="h-3 w-3" />
                        <span>
                          {formatRelativeTime(new Date(session.updatedAt))}
                        </span>
                        <span className="text-muted-foreground/50">•</span>
                        <span>
                          {messageCount} {t('agent.messages', 'messages')}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>

        <div className="border-primary/10 border-t p-3">
          <Button
            variant="outline"
            className="hover:bg-primary/10 hover:text-primary hover:border-primary/30 w-full"
            onClick={() => {
              createNewSession();
              setShowHistory(false);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('agent.newSession', 'New Session')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-gold bg-grid-dot flex h-full flex-col overflow-hidden outline-none">
      {/* Header */}
      <div className="border-primary/10 mt-1 flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <div className="bg-primary/15 rounded-base relative flex h-8 w-8 items-center justify-center">
            <Sparkles className="text-primary h-4 w-4" />
            <div className="bg-primary/10 rounded-base absolute inset-0 blur-sm" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              {t('agent.title', 'SQL Pro Agent')}
            </span>
            {(databaseName || tableName) && (
              <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                {databaseName && <span>{databaseName}</span>}
                {tableName && (
                  <>
                    <ChevronRight className="h-2.5 w-2.5" />
                    <span className="text-primary">{tableName}</span>
                  </>
                )}
              </span>
            )}
            {!databaseName && !tableName && (
              <span className="text-muted-foreground text-[10px]">
                {t('agent.subtitle', 'AI-powered database assistant')}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary rounded-base h-7 w-7"
                onClick={() => setShowHistory(true)}
              >
                <History className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('agent.history', 'Chat History')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary rounded-base h-7 w-7"
                onClick={createNewSession}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('agent.newSession', 'New Session')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary rounded-base h-7 w-7"
                onClick={() => setMessages([])}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('agent.clearChat', 'Clear Chat')}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary rounded-base h-7 w-7"
                onClick={() => setShowSettings(true)}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('agent.settings', 'Settings')}
            </TooltipContent>
          </Tooltip>
          <div className="bg-primary/20 mx-1 h-4 w-px" />
          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-primary/10 hover:text-primary rounded-base h-7 w-7"
                onClick={onClose}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('common.close', 'Close')}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="space-y-3 p-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-primary/15 rounded-base mb-4 flex h-14 w-14 items-center justify-center">
                <Bot className="text-primary/70 h-7 w-7" />
              </div>
              <p className="text-muted-foreground mb-1 text-sm font-medium">
                {t('agent.welcomeTitle', 'How can I help?')}
              </p>
              <p className="text-muted-foreground/70 mb-4 max-w-[220px] text-xs leading-relaxed">
                {t(
                  'agent.welcomeDescription',
                  'Ask me to query data, analyze schemas, or optimize your database.'
                )}
              </p>
              <div className="grid w-full max-w-[240px] grid-cols-2 gap-1.5">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleQuickAction(action.query)}
                    className="bg-background/60 text-muted-foreground hover:bg-primary/10 hover:text-primary border-primary/10 rounded-base border px-2.5 py-2 text-left text-[11px] font-medium transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <AgentMessage
              key={message.id}
              message={message}
              isStreaming={isLoading && index === messages.length - 1}
              onCopy={() => handleCopyMessage(getMessageText(message))}
            />
          ))}
        </div>
      </ScrollArea>

      {/* Error Banner */}
      {error && (
        <div className="border-destructive/30 bg-destructive/10 border-t px-3 py-2.5">
          <div className="flex items-start gap-2">
            <AlertCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-destructive text-xs font-medium">
                {t('agent.errorTitle', 'Something went wrong')}
              </p>
              <p className="text-destructive/80 mt-0.5 text-xs">
                {error.message}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive h-6 w-6"
                onClick={clearError}
                title={t('common.close', 'Close')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-primary/10 border-t p-3">
        <div className="bg-background/80 ring-primary/20 focus-within:ring-primary/40 rounded-base flex items-end gap-2 px-3 py-2 ring-1 transition-all focus-within:ring-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('agent.placeholder', 'Ask about your data...')}
            disabled={isLoading || !isConfigured}
            rows={1}
            className="placeholder:text-muted-foreground max-h-[120px] min-h-[32px] flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-xs disabled:cursor-not-allowed disabled:opacity-50"
          />
          {isLoading ? (
            <Tooltip>
              <TooltipTrigger>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-primary hover:bg-primary/10 hover:text-primary rounded-base h-8 w-8 shrink-0"
                  onClick={stop}
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t('agent.cancel', 'Cancel')} (Esc)
              </TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger>
                <button
                  type="submit"
                  disabled={!input.trim() || !isConfigured}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-base flex h-8 w-8 shrink-0 items-center justify-center transition-all disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                {t('agent.send', 'Send')} (⌘↵)
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <div className="text-muted-foreground/60 mt-1.5 flex items-center justify-between text-[10px]">
          <span>
            {t(
              'agent.disclaimer',
              'AI may make mistakes. Verify important queries.'
            )}
          </span>
          <div className="flex items-center gap-2">
            <kbd className="bg-primary/10 text-primary/80 rounded px-1 py-0.5 font-mono text-[9px]">
              ⌘↵
            </kbd>
            <span>{t('agent.toSend', 'to send')}</span>
          </div>
        </div>
      </form>
    </div>
  );
}
