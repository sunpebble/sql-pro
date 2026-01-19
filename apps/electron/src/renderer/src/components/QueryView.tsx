import { QueryBuilder } from './query-builder';
import { QueryEditor } from './QueryEditor';

interface QueryViewProps {
  /** Query view mode: 'editor' for SQL editor, 'builder' for visual query builder */
  mode?: 'editor' | 'builder';
}

/**
 * Combined Query View component that includes SQL Query Editor and Query Builder.
 * Mode is controlled externally via ContentHeader for unified UX.
 */
export function QueryView({ mode = 'editor' }: QueryViewProps) {
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      {mode === 'editor' ? <QueryEditor /> : <QueryBuilder />}
    </div>
  );
}
