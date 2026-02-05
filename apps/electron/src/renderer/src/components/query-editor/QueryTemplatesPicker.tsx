import type {
  QueryTemplate,
  TemplateCategory,
} from '@/stores/query-templates-store';
import { Badge } from '@sqlpro/ui/badge';
import { Button } from '@sqlpro/ui/button';
import { Input } from '@sqlpro/ui/input';
import { Label } from '@sqlpro/ui/label';
import { ScrollArea } from '@sqlpro/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@sqlpro/ui/select';
import { Textarea } from '@sqlpro/ui/textarea';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@sqlpro/ui/tooltip';
import {
  Code,
  Copy,
  FileText,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SqlHighlight } from '@/components/ui/sql-highlight';
import { cn, TOOLTIP_CONTENT_STYLE } from '@/lib/utils';
import {
  TEMPLATE_CATEGORIES,
  useQueryTemplatesStore,
} from '@/stores/query-templates-store';

interface QueryTemplatesPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (query: string) => void;
}

const CATEGORY_COLORS: Record<TemplateCategory | 'all', string> = {
  all: 'bg-gray-100 text-gray-700',
  select: 'bg-blue-100 text-blue-700',
  insert: 'bg-green-100 text-green-700',
  update: 'bg-amber-100 text-amber-700',
  delete: 'bg-red-100 text-red-700',
  schema: 'bg-purple-100 text-purple-700',
  analysis: 'bg-cyan-100 text-cyan-700',
  maintenance: 'bg-gray-100 text-gray-700',
  custom: 'bg-pink-100 text-pink-700',
};

interface TemplateCardProps {
  template: QueryTemplate;
  onSelect: (query: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

const TemplateCard = memo(
  ({ template, onSelect, onDuplicate, onDelete }: TemplateCardProps) => {
    const { t } = useTranslation('common');
    return (
      <div
        className={cn(
          'group rounded-base hover:border-main hover:bg-accent/30 relative flex cursor-pointer flex-col gap-2.5 border-2 p-4 transition-all duration-200',
          template.isBuiltIn && 'border-dashed'
        )}
        onClick={() => onSelect(template.query)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {template.isBuiltIn ? (
              <Star className="h-4 w-4 shrink-0 text-amber-500" />
            ) : (
              <FileText className="text-muted-foreground h-4 w-4 shrink-0" />
            )}
            <span className="font-heading truncate">{template.name}</span>
          </div>
          <Badge
            variant="secondary"
            className={cn(
              'text-2xs shrink-0 font-medium',
              CATEGORY_COLORS[template.category]
            )}
          >
            {template.category}
          </Badge>
        </div>

        {/* Description */}
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {template.description}
        </p>

        {/* Code Preview */}
        <SqlHighlight
          code={template.query}
          maxLines={3}
          className="rounded-base bg-muted/50 p-2.5 text-xs"
        />

        {/* Actions - appear on hover */}
        <div className="rounded-base bg-background absolute top-2 right-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <TooltipProvider delay={200}>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(template.id);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
                {t('queryTemplates.duplicateTemplate')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {!template.isBuiltIn && (
            <TooltipProvider delay={200}>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(template.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className={TOOLTIP_CONTENT_STYLE}>
                  {t('queryTemplates.deleteTemplate')}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    );
  }
);

interface NewTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
}

export function NewTemplateDialog({
  open,
  onOpenChange,
  initialQuery = '',
}: NewTemplateDialogProps) {
  const { t } = useTranslation('common');
  const { addTemplate } = useQueryTemplatesStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<TemplateCategory>('custom');

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !query.trim()) return;

    addTemplate({
      name: name.trim(),
      description: description.trim(),
      query: query.trim(),
      category,
    });

    setName('');
    setDescription('');
    setQuery('');
    setCategory('custom');
    onOpenChange(false);
  }, [addTemplate, category, description, name, onOpenChange, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('queryTemplates.createTitle')}</DialogTitle>
          <DialogDescription>
            {t('queryTemplates.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t('queryTemplates.name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('queryTemplates.namePlaceholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">
              {t('queryTemplates.descriptionLabel')}
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('queryTemplates.descriptionPlaceholder')}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">{t('queryTemplates.category')}</Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as TemplateCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_CATEGORIES.filter((c) => c.value !== 'all').map(
                  (cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="query">{t('queryTemplates.sqlQuery')}</Label>
            <Textarea
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('queryTemplates.sqlQueryPlaceholder')}
              className="min-h-30 font-mono"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('queryTemplates.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !query.trim()}
          >
            {t('queryTemplates.createTemplate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const QueryTemplatesPicker = memo(
  ({ open, onOpenChange, onSelect }: QueryTemplatesPickerProps) => {
    const { t } = useTranslation('common');
    const {
      searchQuery,
      selectedCategory,
      setSearchQuery,
      setSelectedCategory,
      getFilteredTemplates,
      duplicateTemplate,
      deleteTemplate,
    } = useQueryTemplatesStore();

    const [showNewDialog, setShowNewDialog] = useState(false);

    const filteredTemplates = useMemo(
      () => getFilteredTemplates(),
      [getFilteredTemplates]
    );

    const handleSelect = useCallback(
      (query: string) => {
        onSelect(query);
        onOpenChange(false);
      },
      [onOpenChange, onSelect]
    );

    const handleDuplicate = useCallback(
      (id: string) => {
        duplicateTemplate(id);
      },
      [duplicateTemplate]
    );

    const handleDelete = useCallback(
      (id: string) => {
        deleteTemplate(id);
      },
      [deleteTemplate]
    );

    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl p-0">
            <DialogHeader className="border-b-2 px-6 py-4">
              <DialogTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {t('queryTemplates.title')}
              </DialogTitle>
              <DialogDescription>
                {t('queryTemplates.description')}
              </DialogDescription>
            </DialogHeader>

            {/* Search and Filter */}
            <div className="flex flex-col gap-3 border-b-2 px-6 py-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input
                  placeholder={t('queryTemplates.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2"
                    onClick={() => setSearchQuery('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={(value) =>
                    setSelectedCategory(value as TemplateCategory | 'all')
                  }
                >
                  <SelectTrigger className="w-30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowNewDialog(true)} size="sm">
                  <Plus className="mr-1 h-4 w-4" />
                  {t('queryTemplates.new')}
                </Button>
              </div>
            </div>

            {/* Template Grid */}
            <ScrollArea className="h-[60vh]">
              <div className="p-6">
                {filteredTemplates.length === 0 ? (
                  <div className="text-muted-foreground flex flex-col items-center justify-center py-16">
                    <FileText className="mb-3 h-12 w-12 opacity-40" />
                    <p className="font-medium">
                      {t('queryTemplates.noTemplatesFound')}
                    </p>
                    <p className="text-sm opacity-70">
                      {t('queryTemplates.tryAdjustingSearch')}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredTemplates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onSelect={handleSelect}
                        onDuplicate={handleDuplicate}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <NewTemplateDialog
          open={showNewDialog}
          onOpenChange={setShowNewDialog}
        />
      </>
    );
  }
);
