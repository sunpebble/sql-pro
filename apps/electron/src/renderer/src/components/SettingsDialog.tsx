import type { SettingsSection } from './settings/SettingsNav';
// 直接导入优化 tree-shaking (vercel-react-best-practices: bundle-barrel-imports)
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AdvancedSection } from './settings/sections/AdvancedSection';
import { AppearanceSection } from './settings/sections/AppearanceSection';
import { EditorSection } from './settings/sections/EditorSection';
import { GeneralSection } from './settings/sections/GeneralSection';
import { ProSection } from './settings/sections/ProSection';
import { SettingsNav } from './settings/SettingsNav';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { t } = useTranslation('settings');
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('general');

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return <GeneralSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'editor':
        return <EditorSection />;
      case 'pro':
        return <ProSection />;
      case 'advanced':
        return <AdvancedSection onOpenChange={onOpenChange} />;
      default:
        return <GeneralSection />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        decorated
      >
        <DialogHeader className="border-border shrink-0 border-b px-6 pt-6 pb-4">
          <DialogTitle className="text-lg tracking-wide">
            {t('settings.title', { ns: 'dialog' })}
          </DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          {/* Left Navigation */}
          <div className="border-border shrink-0 border-r py-4 pl-4">
            <SettingsNav
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />
          </div>

          {/* Right Content Area */}
          <ScrollArea className="h-[60vh] flex-1">
            <div className="px-6 py-4">{renderSection()}</div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
