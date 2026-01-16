import type { EdgeProps } from '@xyflow/react';
import type { JoinType, QueryBuilderEdgeData } from '@/types/query-builder';
import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { cn } from '@/lib/utils';
import { useQueryBuilderStore } from '@/stores/query-builder-store';

const JOIN_TYPE_COLORS: Record<JoinType, string> = {
  INNER: 'stroke-green-500',
  LEFT: 'stroke-blue-500',
  RIGHT: 'stroke-purple-500',
  FULL: 'stroke-orange-500',
  CROSS: 'stroke-gray-500',
};

const JOIN_TYPE_LABELS: Record<JoinType, string> = {
  INNER: 'INNER JOIN',
  LEFT: 'LEFT JOIN',
  RIGHT: 'RIGHT JOIN',
  FULL: 'FULL JOIN',
  CROSS: 'CROSS JOIN',
};

// Short labels for compact display
const JOIN_TYPE_SHORT: Record<JoinType, string> = {
  INNER: 'I',
  LEFT: 'L',
  RIGHT: 'R',
  FULL: 'F',
  CROSS: 'X',
};

const JOIN_TYPE_BG: Record<JoinType, string> = {
  INNER: 'bg-green-500',
  LEFT: 'bg-blue-500',
  RIGHT: 'bg-purple-500',
  FULL: 'bg-orange-500',
  CROSS: 'bg-gray-500',
};

function QueryBuilderJoinEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const { updateJoinType, removeJoin } = useQueryBuilderStore();
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false); // Pinned state for click-to-top

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Label position at the midpoint of the bezier curve
  // For bezier curves, the midpoint (t=0.5) is approximately at the center
  const finalLabelX = (sourceX + targetX) / 2;
  const finalLabelY = (sourceY + targetY) / 2;

  const edgeData = data as QueryBuilderEdgeData | undefined;
  const joinType = edgeData?.joinType || 'INNER';
  const strokeColor = JOIN_TYPE_COLORS[joinType];

  const handleJoinTypeChange = useCallback(
    (newType: JoinType) => {
      updateJoinType(id, newType);
    },
    [id, updateJoinType]
  );

  const handleRemove = useCallback(() => {
    removeJoin(id);
  }, [id, removeJoin]);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          strokeColor,
          'stroke-2',
          selected && 'stroke-[3px]',
          isHovered && 'stroke-[3px]'
        )}
        interactionWidth={20}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${finalLabelX}px,${finalLabelY}px)`,
            pointerEvents: 'all',
            zIndex: isPinned ? 10000 : isHovered ? 5000 : 1,
            isolation: 'isolate', // Create new stacking context
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            setIsPinned(true);
          }}
        >
          <div
            className={cn(
              'bg-background flex items-center rounded border px-1 py-0.5 shadow-sm',
              'transition-all duration-150',
              (selected || isHovered) && 'ring-primary ring-2'
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1 px-1 py-0 font-mono text-[10px]"
                >
                  {/* Color dot */}
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      JOIN_TYPE_BG[joinType]
                    )}
                  />
                  {/* Short type + column info */}
                  <span className="font-semibold">
                    {JOIN_TYPE_SHORT[joinType]}
                  </span>
                  {edgeData?.sourceColumn && edgeData?.targetColumn && (
                    <span className="text-muted-foreground">
                      {edgeData.sourceColumn}={edgeData.targetColumn}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                {(Object.keys(JOIN_TYPE_LABELS) as JoinType[]).map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => handleJoinTypeChange(type)}
                    className={cn(
                      'font-mono text-xs',
                      type === joinType && 'bg-accent'
                    )}
                  >
                    <span
                      className={cn(
                        'mr-2 h-2 w-2 rounded-full',
                        type === 'INNER' && 'bg-green-500',
                        type === 'LEFT' && 'bg-blue-500',
                        type === 'RIGHT' && 'bg-purple-500',
                        type === 'FULL' && 'bg-orange-500',
                        type === 'CROSS' && 'bg-gray-500'
                      )}
                    />
                    {JOIN_TYPE_LABELS[type]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {(selected || isHovered) && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={handleRemove}
              >
                <Trash2 className="text-destructive h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const QueryBuilderJoinEdge = memo(QueryBuilderJoinEdgeComponent);
