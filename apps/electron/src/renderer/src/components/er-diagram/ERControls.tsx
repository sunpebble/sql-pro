import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@sqlpro/ui/tooltip';
import { Panel, useReactFlow, useStore } from '@xyflow/react';
import {
  Download,
  FileCode,
  FileImage,
  LayoutGrid,
  Maximize,
  Minus,
  Plus,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { exportDiagramAsPng, exportDiagramAsSvg } from './utils/export-diagram';

interface ERControlsProps {
  onResetLayout: () => void;
}

export function ERControls({ onResetLayout }: ERControlsProps) {
  const { fitView, zoomIn, zoomOut, setViewport, getViewport } = useReactFlow();
  const [isExporting, setIsExporting] = useState(false);
  const { t } = useTranslation('common');

  // Get current zoom level from React Flow store
  const zoom = useStore((state) => state.transform[2]);
  const zoomPercentage = Math.round(zoom * 100);

  const handleExport = useCallback(
    async (format: 'png' | 'svg') => {
      setIsExporting(true);
      try {
        const element = document.querySelector(
          '.react-flow__viewport'
        ) as HTMLElement;

        if (!element) {
          console.error('Could not find React Flow viewport element');
          return;
        }

        const container = element.closest('.react-flow') as HTMLElement;
        if (!container) {
          console.error('Could not find React Flow container');
          return;
        }

        if (format === 'png') {
          await exportDiagramAsPng(container);
        } else {
          await exportDiagramAsSvg(container);
        }
      } catch (err) {
        console.error('ER diagram export failed:', err);
        toast.error(t('erDiagram.exportFailed', 'Failed to export diagram'));
      } finally {
        setIsExporting(false);
      }
    },
    [t]
  );

  const handleFitView = useCallback(() => {
    fitView({ padding: 0.2, duration: 200 });
  }, [fitView]);

  const handleZoomIn = useCallback(() => {
    zoomIn({ duration: 200 });
  }, [zoomIn]);

  const handleZoomOut = useCallback(() => {
    zoomOut({ duration: 200 });
  }, [zoomOut]);

  const handleResetZoom = useCallback(() => {
    const viewport = getViewport();
    setViewport({ ...viewport, zoom: 1 }, { duration: 200 });
  }, [getViewport, setViewport]);

  return (
    <Panel
      position="bottom-center"
      className="rounded-base bg-background border-border flex items-center gap-1 border px-2 py-1.5 shadow-sm"
    >
      {/* Zoom Out */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomOut}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{t('erDiagram.zoomOut')}</p>
        </TooltipContent>
      </Tooltip>

      {/* Zoom Percentage - clickable to reset */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-14 font-mono tabular-nums"
            style={{ fontSize: 'calc(var(--font-ui-size, 13px) * 0.85)' }}
            onClick={handleResetZoom}
          >
            {zoomPercentage}%
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{t('erDiagram.resetZoom')}</p>
        </TooltipContent>
      </Tooltip>

      {/* Zoom In */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleZoomIn}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{t('erDiagram.zoomIn')}</p>
        </TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="bg-border mx-1 h-5 w-px" />

      {/* Fit View */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleFitView}
          >
            <Maximize className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{t('erDiagram.fitView')}</p>
        </TooltipContent>
      </Tooltip>

      {/* Reset Layout */}
      <Tooltip>
        <TooltipTrigger>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onResetLayout}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{t('erDiagram.resetLayout')}</p>
        </TooltipContent>
      </Tooltip>

      {/* Divider */}
      <div className="bg-border mx-1 h-5 w-px" />

      {/* Export Menu */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <DropdownMenuTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={isExporting}
              >
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t('erDiagram.export')}</p>
          </TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center" side="top" className="mb-2">
          <DropdownMenuItem onClick={() => handleExport('png')}>
            <FileImage className="mr-2 h-4 w-4" />
            {t('erDiagram.exportPng')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('svg')}>
            <FileCode className="mr-2 h-4 w-4" />
            {t('erDiagram.exportSvg')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Panel>
  );
}
