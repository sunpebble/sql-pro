import type { EdgeProps } from '@xyflow/react';
import type { JoinType, QueryBuilderEdgeData } from '@/types/query-builder';
import { Button } from '@sqlpro/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@sqlpro/ui/dropdown-menu';
import { BaseEdge, EdgeLabelRenderer } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
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

const JOIN_TYPE_BG: Record<JoinType, string> = {
  INNER: 'bg-green-500',
  LEFT: 'bg-blue-500',
  RIGHT: 'bg-purple-500',
  FULL: 'bg-orange-500',
  CROSS: 'bg-gray-500',
};

const JOIN_TYPE_TEXT: Record<JoinType, string> = {
  INNER: 'text-green-600 dark:text-green-400',
  LEFT: 'text-blue-600 dark:text-blue-400',
  RIGHT: 'text-purple-600 dark:text-purple-400',
  FULL: 'text-orange-600 dark:text-orange-400',
  CROSS: 'text-gray-600 dark:text-gray-400',
};

function QueryBuilderJoinEdgeComponent({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps) {
  const { updateJoinType, removeJoin, highlightedEdgeIds, edges } =
    useQueryBuilderStore();
  const [isHovered, setIsHovered] = useState(false);

  const edgeData = data as QueryBuilderEdgeData | undefined;
  const joinType = edgeData?.joinType || 'INNER';

  const { edgeIndex, totalEdges } = useMemo(() => {
    const sameNodeEdges = edges.filter(
      (e) =>
        (e.source === source && e.target === target) ||
        (e.source === target && e.target === source)
    );
    const idx = sameNodeEdges.findIndex((e) => e.id === id);
    return { edgeIndex: idx, totalEdges: sameNodeEdges.length };
  }, [edges, id, source, target]);

  const EDGE_SPACING = 28;
  const centerOffset =
    totalEdges > 1 ? (edgeIndex - (totalEdges - 1) / 2) * EDGE_SPACING : 0;

  const { edgePath, labelX, labelY } = useMemo(() => {
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2 + centerOffset;
    const radius = 8;

    const goingRight = targetX > sourceX;
    const firstTurnX = goingRight
      ? Math.min(sourceX + 40, midX - radius)
      : Math.max(sourceX - 40, midX + radius);
    const lastTurnX = goingRight
      ? Math.max(targetX - 40, midX + radius)
      : Math.min(targetX + 40, midX - radius);

    let path: string;

    if (Math.abs(sourceY - targetY) < 2 && totalEdges === 1) {
      path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    } else {
      const dy1 = midY - sourceY;
      const dy2 = targetY - midY;
      const r = Math.min(radius, Math.abs(dy1) / 2, Math.abs(dy2) / 2, 20);

      path = `M ${sourceX} ${sourceY}`;
      path += ` L ${firstTurnX - r} ${sourceY}`;
      path += ` Q ${firstTurnX} ${sourceY} ${firstTurnX} ${sourceY + (dy1 > 0 ? r : -r)}`;
      path += ` L ${firstTurnX} ${midY - (dy1 > 0 ? r : -r)}`;
      path += ` Q ${firstTurnX} ${midY} ${firstTurnX + (goingRight ? r : -r)} ${midY}`;
      path += ` L ${lastTurnX - (goingRight ? r : -r)} ${midY}`;
      path += ` Q ${lastTurnX} ${midY} ${lastTurnX} ${midY + (dy2 > 0 ? r : -r)}`;
      path += ` L ${lastTurnX} ${targetY - (dy2 > 0 ? r : -r)}`;
      path += ` Q ${lastTurnX} ${targetY} ${lastTurnX + (goingRight ? r : -r)} ${targetY}`;
      path += ` L ${targetX} ${targetY}`;
    }

    return { edgePath: path, labelX: (sourceX + targetX) / 2, labelY: midY };
  }, [sourceX, sourceY, targetX, targetY, centerOffset, totalEdges]);

  const strokeColor = JOIN_TYPE_COLORS[joinType];
  const textColor = JOIN_TYPE_TEXT[joinType];
  const isHighlighted = highlightedEdgeIds.has(id);

  const sourceCardinality = joinType === 'CROSS' ? 'n' : '1';
  const targetCardinality =
    joinType === 'LEFT' || joinType === 'FULL'
      ? '0..n'
      : joinType === 'CROSS'
        ? 'n'
        : '1..n';

  const handleJoinTypeChange = useCallback(
    (newType: JoinType) => {
      updateJoinType(id, newType);
    },
    [id, updateJoinType]
  );

  const handleRemove = useCallback(() => {
    removeJoin(id);
  }, [id, removeJoin]);

  const sourceOffset = 24;
  const targetOffset = 24;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        className={cn(
          strokeColor,
          'stroke-[2px]',
          (selected || isHovered) && 'stroke-[3px]',
          isHighlighted &&
            'stroke-cyan-500 stroke-[4px] drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]'
        )}
        interactionWidth={20}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${sourceX + sourceOffset}px,${sourceY}px)`,
            pointerEvents: 'none',
          }}
          className="nodrag nopan"
        >
          <span
            className={cn(
              'bg-background/90 rounded px-1 py-0.5 font-mono text-[10px] font-semibold',
              isHighlighted ? 'bg-cyan-500 text-white' : textColor
            )}
          >
            {sourceCardinality}
          </span>
        </div>

        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${targetX - targetOffset}px,${targetY}px)`,
            pointerEvents: 'none',
          }}
          className="nodrag nopan"
        >
          <span
            className={cn(
              'bg-background/90 rounded px-1 py-0.5 font-mono text-[10px] font-semibold',
              isHighlighted ? 'bg-cyan-500 text-white' : textColor
            )}
          >
            {targetCardinality}
          </span>
        </div>

        <div
          role="toolbar"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            zIndex: isHovered ? 5000 : 1,
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className={cn(
              'bg-background flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 shadow-sm',
              'transition-all duration-150',
              (selected || isHovered) && 'ring-primary ring-2'
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto gap-1.5 px-1 py-0.5 font-mono text-[10px]"
                >
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      JOIN_TYPE_BG[joinType]
                    )}
                  />
                  <span className="font-semibold">{joinType}</span>
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
                        JOIN_TYPE_BG[type]
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
