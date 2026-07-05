import type { TemplateCategory } from '@/stores/query-templates-store';
import { Button } from '@quarry/ui/button';
import { Input } from '@quarry/ui/input';
import { Label } from '@quarry/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@quarry/ui/select';
import { Textarea } from '@quarry/ui/textarea';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  TEMPLATE_CATEGORIES,
  useQueryTemplatesStore,
} from '@/stores/query-templates-store';

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
