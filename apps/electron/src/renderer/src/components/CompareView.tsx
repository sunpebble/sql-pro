import { Tabs, TabsList, TabsTrigger } from '@sqlpro/ui/tabs';
import { GitCompare, Table2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { DataDiffPanel } from './data-diff/DataDiffPanel';
import { SchemaComparisonPanel } from './schema-comparison';

type CompareTab = 'schema' | 'data';

interface CompareViewProps {
  className?: string;
  defaultTab?: CompareTab;
}

/**
 * Unified Compare view that combines Schema Compare and Data Compare
 * in a single tab-based interface.
 */
export function CompareView({
  className,
  defaultTab = 'schema',
}: CompareViewProps) {
  const [activeTab, setActiveTab] = useState<CompareTab>(defaultTab);
  const { t } = useTranslation('common');

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Tab Navigation */}
      <div className="border-border/40 flex shrink-0 items-center border-b px-4 py-2">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as CompareTab)}
          className="w-full"
        >
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="schema" className="gap-2">
              <GitCompare className="h-4 w-4" />
              {t('compare.schemaCompare', { defaultValue: 'Schema Compare' })}
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Table2 className="h-4 w-4" />
              {t('compare.dataCompare', { defaultValue: 'Data Compare' })}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab Content */}
      <div className="min-h-0 flex-1">
        {activeTab === 'schema' && <SchemaComparisonPanel className="h-full" />}
        {activeTab === 'data' && <DataDiffPanel className="h-full" />}
      </div>
    </div>
  );
}
