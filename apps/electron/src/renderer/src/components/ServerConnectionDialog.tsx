/**
 * Server Connection Dialog
 * Dialog for configuring MySQL, PostgreSQL, and Supabase connections
 */

import type {
  DatabaseConnectionConfig,
  DatabaseType,
  TestConnectionResponse,
} from '@shared/types';
import { Button } from '@sqlpro/ui/button';
import { Checkbox } from '@sqlpro/ui/checkbox';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DEFAULT_PORTS: Record<DatabaseType, number> = {
  sqlite: 0,
  mysql: 3306,
  postgresql: 5432,
  supabase: 5432,
};

const DATABASE_LABELS: Record<DatabaseType, string> = {
  sqlite: 'SQLite',
  mysql: 'MySQL',
  postgresql: 'PostgreSQL',
  supabase: 'Supabase',
};

/**
 * Parse a PostgreSQL/MySQL connection string URL
 * Supports formats:
 * - postgresql://user:password@host:port/database
 * - postgres://user:password@host:port/database
 * - mysql://user:password@host:port/database
 * - user:password@host:port/database (without scheme)
 */
function parseConnectionString(connectionString: string): {
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
} | null {
  try {
    let urlString = connectionString.trim();

    // Add scheme if missing for URL parsing
    if (!urlString.includes('://')) {
      urlString = `postgresql://${urlString}`;
    }

    const url = new URL(urlString);
    const result: {
      host?: string;
      port?: string;
      database?: string;
      username?: string;
      password?: string;
      ssl?: boolean;
    } = {};

    if (url.hostname) result.host = url.hostname;
    if (url.port) result.port = url.port;
    if (url.pathname && url.pathname.length > 1) {
      result.database = url.pathname.slice(1); // Remove leading /
    }
    if (url.username) result.username = decodeURIComponent(url.username);
    if (url.password) result.password = decodeURIComponent(url.password);

    // Check for SSL in query params
    const sslParam =
      url.searchParams.get('sslmode') || url.searchParams.get('ssl');
    if (sslParam && sslParam !== 'disable') {
      result.ssl = true;
    }

    return result;
  } catch {
    return null;
  }
}

interface ServerConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  databaseType: DatabaseType;
  onConnect: (config: DatabaseConnectionConfig) => void;
  isConnecting?: boolean;
  error?: string | null;
  /** Edit mode: pre-fill form with existing config */
  mode?: 'new' | 'edit';
  /** Initial config for edit mode */
  initialConfig?: DatabaseConnectionConfig;
}

export function ServerConnectionDialog({
  open,
  onOpenChange,
  databaseType,
  onConnect,
  isConnecting = false,
  error,
  mode = 'new',
  initialConfig,
}: ServerConnectionDialogProps) {
  const { t } = useTranslation('dialog');
  const isSupabase = databaseType === 'supabase';
  const isEditMode = mode === 'edit';

  // Form state
  const [host, setHost] = useState('');
  const [port, setPort] = useState(DEFAULT_PORTS[databaseType].toString());
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [useSSL, setUseSSL] = useState(isSupabase); // Supabase always uses SSL
  const [readOnly, setReadOnly] = useState(false);

  // Supabase-specific
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');

  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(
    null
  );

  // Reset form when dialog opens or database type changes

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect -- Intentional form reset on dialog open or mode change */
      if (isEditMode && initialConfig) {
        // Pre-fill with existing config for edit mode
        setHost(initialConfig.host || '');
        setPort(
          initialConfig.port?.toString() ||
            DEFAULT_PORTS[databaseType].toString()
        );
        setDatabase(initialConfig.database || '');
        setUsername(initialConfig.username || '');
        setPassword(initialConfig.password || '');
        setDisplayName(initialConfig.name || '');
        setUseSSL(
          initialConfig.ssl === true ||
            (typeof initialConfig.ssl === 'object' && !!initialConfig.ssl)
        );
        setReadOnly(initialConfig.readOnly || false);
        setSupabaseUrl(initialConfig.supabaseUrl || '');
        setSupabaseKey(initialConfig.supabaseKey || '');
      } else {
        // Reset for new connection
        setHost('');
        setPort(DEFAULT_PORTS[databaseType].toString());
        setDatabase(databaseType === 'supabase' ? 'postgres' : '');
        setUsername(databaseType === 'supabase' ? 'postgres' : '');
        setPassword('');
        setDisplayName('');
        setUseSSL(databaseType === 'supabase');
        setReadOnly(false);
        setSupabaseUrl('');
        setSupabaseKey('');
      }
      setTestResult(null);
      /* eslint-enable react-hooks-extra/no-direct-set-state-in-use-effect */
    }
  }, [open, databaseType, isEditMode, initialConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const config: DatabaseConnectionConfig = {
      type: databaseType,
      name:
        displayName ||
        (isSupabase ? supabaseUrl : `${host}:${port}/${database}`),
      readOnly,
    };

    if (isSupabase) {
      config.supabaseUrl = supabaseUrl;
      config.supabaseKey = supabaseKey;
      config.ssl = true;
      // Pass host if user provided one (for pooler connections)
      if (host) {
        config.host = host;
      }
      // Pass port if user provided one
      if (port && port !== DEFAULT_PORTS[databaseType].toString()) {
        config.port = Number.parseInt(port, 10);
      }
      // Pass username if user provided one
      if (username) {
        config.username = username;
      }
    } else {
      config.host = host;
      config.port = Number.parseInt(port, 10);
      config.database = database;
      config.username = username;
      config.password = password;
      config.ssl = useSSL;
    }

    onConnect(config);
  };

  const isFormValid = isSupabase
    ? supabaseUrl && supabaseKey
    : host && database;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-md">
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <DialogHeader className="pb-4">
            <DialogTitle>
              {isEditMode ? t('connection.editTitle') : t('connection.title')}{' '}
              {DATABASE_LABELS[databaseType]}
            </DialogTitle>
            <DialogDescription>
              {isSupabase
                ? isEditMode
                  ? t('connection.editDescriptionSupabase')
                  : t('connection.descriptionSupabase')
                : isEditMode
                  ? t('connection.editDescription', {
                      dbType: DATABASE_LABELS[databaseType],
                    })
                  : t('connection.description', {
                      dbType: DATABASE_LABELS[databaseType],
                    })}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[50vh] overflow-x-hidden">
            <div className="space-y-4 px-1 pr-5">
              {/* Quick import from connection string (for non-Supabase) */}
              {!isSupabase && !isEditMode && (
                <div className="space-y-2">
                  <Label htmlFor="connectionString">
                    Import from URL{' '}
                    <span className="text-muted-foreground text-xs">
                      (paste to auto-fill)
                    </span>
                  </Label>
                  <Input
                    id="connectionString"
                    placeholder="postgresql://user:password@host:port/database"
                    onChange={(e) => {
                      const parsed = parseConnectionString(e.target.value);
                      if (parsed) {
                        if (parsed.host) setHost(parsed.host);
                        if (parsed.port) setPort(parsed.port);
                        if (parsed.database) setDatabase(parsed.database);
                        if (parsed.username) setUsername(parsed.username);
                        if (parsed.password) setPassword(parsed.password);
                        if (parsed.ssl !== undefined) setUseSSL(parsed.ssl);
                        // Clear the input after successful parse
                        e.target.value = '';
                      }
                    }}
                    className="font-mono text-xs"
                  />
                </div>
              )}

              {/* Display name (optional) */}
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  {t('connection.connectionName')}
                </Label>
                <Input
                  id="displayName"
                  placeholder={t('connection.connectionNamePlaceholder')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              {isSupabase ? (
                <>
                  {/* Supabase URL */}
                  <div className="space-y-2">
                    <Label htmlFor="supabaseUrl">
                      Project URL <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="supabaseUrl"
                      type="url"
                      placeholder="https://your-project.supabase.co"
                      value={supabaseUrl}
                      onChange={(e) => setSupabaseUrl(e.target.value)}
                      required
                    />
                    <p className="text-muted-foreground text-xs">
                      Found in Project Settings → General
                    </p>
                  </div>

                  {/* Supabase Host (optional, for pooler connections) */}
                  <div className="space-y-2">
                    <Label htmlFor="supabaseHost">
                      Database Host{' '}
                      <span className="text-muted-foreground text-xs">
                        (recommended)
                      </span>
                    </Label>
                    <Input
                      id="supabaseHost"
                      placeholder="aws-0-us-east-1.pooler.supabase.com"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                    />
                    <p className="text-muted-foreground text-xs">
                      Found in Project Settings → Database → Connection string.
                      Use pooler host for better performance.
                    </p>
                  </div>

                  {/* Port for Supabase */}
                  <div className="space-y-2">
                    <Label htmlFor="supabasePort">
                      Port{' '}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="supabasePort"
                      type="number"
                      placeholder="5432 or 6543 for transaction mode"
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                    />
                  </div>

                  {/* Username for Supabase */}
                  <div className="space-y-2">
                    <Label htmlFor="supabaseUsername">
                      Username{' '}
                      <span className="text-muted-foreground text-xs">
                        (optional)
                      </span>
                    </Label>
                    <Input
                      id="supabaseUsername"
                      placeholder="postgres or postgres.[project-ref]"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <p className="text-muted-foreground text-xs">
                      For pooler: postgres.[project-ref]. Auto-detected if
                      empty.
                    </p>
                  </div>

                  {/* Supabase Key/Password */}
                  <div className="space-y-2">
                    <Label htmlFor="supabaseKey">
                      Database Password{' '}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="supabaseKey"
                      type="password"
                      placeholder="Your database password"
                      value={supabaseKey}
                      onChange={(e) => setSupabaseKey(e.target.value)}
                      required
                    />
                    <p className="text-muted-foreground text-xs">
                      The password you set when creating the project
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Host */}
                  <div className="space-y-2">
                    <Label htmlFor="host">
                      Host <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="host"
                      placeholder="localhost"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      required
                    />
                  </div>

                  {/* Port */}
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                      id="port"
                      type="number"
                      placeholder={DEFAULT_PORTS[databaseType].toString()}
                      value={port}
                      onChange={(e) => setPort(e.target.value)}
                    />
                  </div>

                  {/* Database */}
                  <div className="space-y-2">
                    <Label htmlFor="database">
                      Database <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="database"
                      placeholder={
                        databaseType === 'postgresql' ? 'postgres' : 'mydb'
                      }
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      required
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      placeholder={
                        databaseType === 'mysql' ? 'root' : 'postgres'
                      }
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  {/* SSL */}
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="ssl"
                      checked={useSSL}
                      onCheckedChange={(checked) => setUseSSL(checked === true)}
                    />
                    <Label htmlFor="ssl" className="font-normal">
                      Use SSL/TLS
                    </Label>
                  </div>
                </>
              )}

              {/* Read-only */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="readOnly"
                  checked={readOnly}
                  onCheckedChange={(checked) => setReadOnly(checked === true)}
                />
                <Label htmlFor="readOnly" className="font-normal">
                  Read-only connection
                </Label>
              </div>

              {/* Error message */}
              {error && (
                <div className="border-destructive/50 bg-destructive/10 text-destructive rounded-md border p-3 text-sm">
                  {error}
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 pt-4">
            <div className="flex w-full flex-col gap-3">
              {/* Test Result Indicator - shown above buttons when present */}
              {testResult && (
                <div className="flex items-center gap-1.5 text-xs">
                  {testResult.success ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                      <span className="text-green-600">
                        Connected
                        {testResult.latencyMs !== undefined && (
                          <span className="text-muted-foreground ml-1">
                            ({testResult.latencyMs}ms)
                          </span>
                        )}
                        {testResult.serverVersion && (
                          <span className="text-muted-foreground ml-1">
                            - {testResult.serverVersion}
                          </span>
                        )}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                      <span className="text-red-600" title={testResult.error}>
                        {testResult.error}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Button Row */}
              <div className="flex items-center justify-between gap-2">
                {/* Test Connection Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setIsTesting(true);
                    setTestResult(null);

                    const config: DatabaseConnectionConfig = {
                      type: databaseType,
                      name:
                        displayName ||
                        (isSupabase
                          ? supabaseUrl
                          : `${host}:${port}/${database}`),
                      readOnly,
                    };

                    if (isSupabase) {
                      config.supabaseUrl = supabaseUrl;
                      config.supabaseKey = supabaseKey;
                      config.ssl = true;
                      if (host) config.host = host;
                      if (
                        port &&
                        port !== DEFAULT_PORTS[databaseType].toString()
                      ) {
                        config.port = Number.parseInt(port, 10);
                      }
                      if (username) config.username = username;
                    } else {
                      config.host = host;
                      config.port = Number.parseInt(port, 10);
                      config.database = database;
                      config.username = username;
                      config.password = password;
                      config.ssl = useSSL;
                    }

                    try {
                      const result = await window.sqlPro.db.testConnection({
                        config,
                      });
                      setTestResult(result);
                    } catch (err) {
                      setTestResult({
                        success: false,
                        error:
                          err instanceof Error
                            ? err.message
                            : 'Test connection failed',
                      });
                    } finally {
                      setIsTesting(false);
                    }
                  }}
                  disabled={!isFormValid || isTesting || isConnecting}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Test Connection'
                  )}
                </Button>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isConnecting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!isFormValid || isConnecting}>
                    {isConnecting
                      ? 'Connecting...'
                      : isEditMode
                        ? 'Save & Connect'
                        : 'Connect'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
