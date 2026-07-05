/**
 * Connection Status Indicator
 *
 * Displays the SSH tunnel status when a connection is using an SSH tunnel.
 * Shows visual feedback for connected, reconnecting, and error states.
 */

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@quarry/ui/tooltip';
import { AlertCircle, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useConnectionStore } from '@/stores/connection-store';

interface ConnectionStatusIndicatorProps {
  connectionId: string;
  className?: string;
}

export function ConnectionStatusIndicator({
  connectionId,
  className,
}: ConnectionStatusIndicatorProps) {
  const { t } = useTranslation();
  const tunnelStatus = useConnectionStore(
    (state) => state.tunnelStatuses[connectionId]
  );
  const pollTunnelStatus = useConnectionStore(
    (state) => state.pollTunnelStatus
  );
  const stopPollingTunnelStatus = useConnectionStore(
    (state) => state.stopPollingTunnelStatus
  );

  // Start polling when component mounts, stop when unmounts
  useEffect(() => {
    pollTunnelStatus(connectionId);
    return () => {
      stopPollingTunnelStatus(connectionId);
    };
  }, [connectionId, pollTunnelStatus, stopPollingTunnelStatus]);

  // Don't render if no tunnel status (connection doesn't use SSH)
  if (!tunnelStatus) {
    return null;
  }

  const getStatusIcon = () => {
    switch (tunnelStatus.state) {
      case 'connected':
        return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'connecting':
      case 'reconnecting':
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />;
      case 'error':
        return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
      case 'disconnected':
      default:
        return <Shield className="text-muted-foreground h-3.5 w-3.5" />;
    }
  };

  const getStatusText = () => {
    switch (tunnelStatus.state) {
      case 'connected':
        return t('ssh.tunnelActive', 'SSH Tunnel Active');
      case 'connecting':
        return t('ssh.tunnelConnecting', 'Connecting SSH Tunnel...');
      case 'reconnecting':
        return t('ssh.tunnelReconnecting', 'Reconnecting SSH Tunnel...');
      case 'error':
        return tunnelStatus.error || t('ssh.tunnelError', 'SSH Tunnel Error');
      case 'disconnected':
      default:
        return t('ssh.tunnelDisconnected', 'SSH Tunnel Disconnected');
    }
  };

  const getStatusColor = () => {
    switch (tunnelStatus.state) {
      case 'connected':
        return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20';
      case 'connecting':
      case 'reconnecting':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'disconnected':
      default:
        return 'bg-muted text-muted-foreground border-muted';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-medium',
              getStatusColor(),
              className
            )}
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
          >
            {getStatusIcon()}
            <span className="hidden sm:inline">
              {tunnelStatus.state === 'connected'
                ? t('ssh.tunnel', 'SSH')
                : tunnelStatus.state === 'reconnecting'
                  ? t('ssh.reconnecting', 'Reconnecting')
                  : tunnelStatus.state === 'error'
                    ? t('ssh.error', 'Error')
                    : t('ssh.tunnel', 'SSH')}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{getStatusText()}</p>
            {tunnelStatus.localPort && (
              <p
                className="text-muted-foreground"
                style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
              >
                {t('ssh.localPort', 'Local port: {{port}}', {
                  port: tunnelStatus.localPort,
                })}
              </p>
            )}
            {tunnelStatus.reconnectAttempts !== undefined &&
              tunnelStatus.reconnectAttempts > 0 && (
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
                >
                  {t('ssh.reconnectAttempts', 'Reconnect attempts: {{count}}', {
                    count: tunnelStatus.reconnectAttempts,
                  })}
                </p>
              )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
