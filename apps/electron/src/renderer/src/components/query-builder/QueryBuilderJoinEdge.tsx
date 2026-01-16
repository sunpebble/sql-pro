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

  // Calculate a unique offset based on source/target Y positions
  // This helps separate multiple edges between the same nodes
  const yDiff = sourceY - targetY;
  const baseOffset = Math.sign(yDiff) * Math.min(Math.abs(yDiff) * 0.3, 50);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    // Add curvature based on Y difference to separate overlapping edges
    curvature: 0.25 + Math.abs(yDiff) * 0.002,
  });

  // Offset label position based on Y difference to prevent overlap
  const labelOffsetY = baseOffset * 0.5;

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
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY + labelOffsetY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={cn(
              'bg-background flex items-center gap-1 rounded-md border px-2 py-1 shadow-sm',
              'transition-all duration-150',
              (selected || isHovered) && 'ring-primary ring-2'
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 font-mono text-xs"
                >
                  {JOIN_TYPE_LABELS[joinType]}
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

          {/* Column info */}
          {edgeData?.sourceColumn && edgeData?.targetColumn && (
            <div className="text-muted-foreground mt-1 text-center text-[10px]">
              {edgeData.sourceColumn} = {edgeData.targetColumn}
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const QueryBuilderJoinEdge = memo(QueryBuilderJoinEdgeComponent);
