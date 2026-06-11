import type { SqlProApiDeps } from '../../lib/sql-pro-api';
import { aiChannels } from './channels';

export function createAiApi({ invoke }: SqlProApiDeps) {
  return {
    getSettings: () => invoke(aiChannels.getSettings.name),
    saveSettings: (r: unknown) => invoke(aiChannels.saveSettings.name, r),
    fetchAnthropic: (r: unknown) => invoke(aiChannels.fetchAnthropic.name, r),
    fetchOpenAI: (r: unknown) => invoke(aiChannels.fetchOpenAI.name, r),
    streamAnthropic: (r: unknown) => invoke(aiChannels.streamAnthropic.name, r),
    streamOpenAI: (r: unknown) => invoke(aiChannels.streamOpenAI.name, r),
    agentQuery: (r: unknown) => invoke(aiChannels.agentQuery.name, r),
    cancelStream: (r: unknown) => invoke(aiChannels.cancelStream.name, r),
    getClaudeCodePaths: () => invoke(aiChannels.getClaudeCodePaths.name),
  };
}

export type AiApi = ReturnType<typeof createAiApi>;
