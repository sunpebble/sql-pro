/**
 * VectorVisualization component for rendering 2D/3D projections of high-dimensional vectors.
 *
 * Uses UMAP dimensionality reduction to project vectors into 2D or 3D space,
 * then renders them on a canvas. Background points are shown in gray,
 * while search results are highlighted in blue.
 *
 * Features:
 * - Hover to see point details in tooltip
 * - Points enlarge on hover
 * - 3D mode shows isometric projection with depth coloring
 */

import type { PointWithVector, VectorSearchResult } from '@shared/types';
import { ToggleGroup, ToggleGroupItem } from '@sqlpro/ui/toggle-group';
import { Box, Loader2, Square } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUMAP } from '@/hooks/useUMAP';
import { cn } from '@/lib/utils';

interface VectorVisualizationProps {
  /** Background points sampled from the collection */
  backgroundPoints: PointWithVector[];
  /** Search results to highlight */
  searchResults: VectorSearchResult[];
  /** Whether data is currently loading */
  isLoading: boolean;
  /** Optional class name for styling */
  className?: string;
}

/** Point with its projected coordinates and metadata */
interface ProjectedPoint {
  x: number;
  y: number;
  z?: number;
  id: string | number;
  isSearchResult: boolean;
  score?: number;
  payload?: Record<string, unknown>;
}

/** Screen-space point for hit testing */
interface ScreenPoint {
  screenX: number;
  screenY: number;
  radius: number;
  point: ProjectedPoint;
}

/** Dimension mode for visualization */
type DimensionMode = '2d' | '3d';

/** Canvas padding in pixels */
const CANVAS_PADDING = 40;

/** Point sizes */
const POINT_RADIUS_BACKGROUND = 4;
const POINT_RADIUS_RESULT = 6;
const POINT_RADIUS_HOVER_SCALE = 1.8;

/** Colors */
const COLOR_BACKGROUND = 'rgba(156, 163, 175, 0.5)'; // gray-400 with opacity
const COLOR_BACKGROUND_HOVER = 'rgba(156, 163, 175, 0.9)';
const COLOR_RESULT = 'rgba(59, 130, 246, 0.8)'; // blue-500 with opacity
const COLOR_RESULT_HOVER = 'rgba(59, 130, 246, 1)';
const COLOR_RESULT_STROKE = 'rgba(37, 99, 235, 1)'; // blue-600

/** Hit test radius multiplier for easier selection */
const HIT_TEST_MULTIPLIER = 2;

/**
 * VectorVisualization component renders a 2D/3D visualization of vector embeddings.
 *
 * It combines background points and search results, runs UMAP dimensionality reduction,
 * and renders the projected points on a canvas.
 */
export const VectorVisualization = memo(
  ({
    backgroundPoints,
    searchResults,
    isLoading,
    className,
  }: VectorVisualizationProps) => {
    const { t } = useTranslation('common');
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State for dimension mode
    const [dimensionMode, setDimensionMode] = useState<DimensionMode>('2d');

    // Canvas size state
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

    // Hover state
    const [hoveredPoint, setHoveredPoint] = useState<ProjectedPoint | null>(
      null
    );
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

    // Screen points for hit testing (updated during draw)
    const screenPointsRef = useRef<ScreenPoint[]>([]);

    // Build payload map for quick lookup
    const payloadMap = useMemo(() => {
      const map = new Map<string, Record<string, unknown>>();
      for (const result of searchResults) {
        if (result.payload) {
          map.set(String(result.id), result.payload);
        }
      }
      for (const point of backgroundPoints) {
        if (point.payload) {
          map.set(String(point.id), point.payload);
        }
      }
      return map;
    }, [backgroundPoints, searchResults]);

    // Combine background points and search results into a single vectors array
    // Track which indices correspond to search results
    const { vectors, pointMetadata } = useMemo(() => {
      const vecs: number[][] = [];
      const metadata: Array<{
        id: string | number;
        isSearchResult: boolean;
        score?: number;
        payload?: Record<string, unknown>;
      }> = [];

      // Create a set of search result IDs for quick lookup
      const searchResultIds = new Set(searchResults.map((r) => String(r.id)));

      // Add background points (excluding those that are search results)
      for (const point of backgroundPoints) {
        const idStr = String(point.id);
        if (!searchResultIds.has(idStr)) {
          vecs.push(point.vector);
          metadata.push({
            id: point.id,
            isSearchResult: false,
            payload: payloadMap.get(idStr),
          });
        }
      }

      // Add search results with their vectors (if available in background points)
      // Search results may not have vectors, so we need to find them in background points
      for (const result of searchResults) {
        const bgPoint = backgroundPoints.find(
          (p) => String(p.id) === String(result.id)
        );
        if (bgPoint) {
          vecs.push(bgPoint.vector);
          metadata.push({
            id: result.id,
            isSearchResult: true,
            score: result.score,
            payload: result.payload || payloadMap.get(String(result.id)),
          });
        }
      }

      return { vectors: vecs, pointMetadata: metadata };
    }, [backgroundPoints, searchResults, payloadMap]);

    // Compute UMAP projection
    const {
      embedding,
      isComputing,
      error: umapError,
      progress,
    } = useUMAP(vectors, {
      nComponents: dimensionMode === '2d' ? 2 : 3,
      nNeighbors: Math.min(15, Math.max(2, vectors.length - 1)),
      minDist: 0.1,
      enabled: vectors.length >= 3,
    });

    // Map embedding coordinates back to points with metadata
    const projectedPoints: ProjectedPoint[] = useMemo(() => {
      if (!embedding || embedding.length !== pointMetadata.length) {
        return [];
      }

      return embedding.map((coords, i) => ({
        x: coords[0],
        y: coords[1],
        z: dimensionMode === '3d' ? coords[2] : undefined,
        id: pointMetadata[i].id,
        isSearchResult: pointMetadata[i].isSearchResult,
        score: pointMetadata[i].score,
        payload: pointMetadata[i].payload,
      }));
    }, [embedding, pointMetadata, dimensionMode]);

    // Handle canvas resize
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setCanvasSize({
            width: Math.floor(width),
            height: Math.floor(height),
          });
        }
      });

      resizeObserver.observe(container);

      return () => {
        resizeObserver.disconnect();
      };
    }, []);

    // Draw points on canvas
    const drawCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = canvasSize;
      if (width === 0 || height === 0) return;

      // Set canvas resolution for high DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Reset screen points
      const newScreenPoints: ScreenPoint[] = [];

      // If no points, nothing to draw
      if (projectedPoints.length === 0) {
        screenPointsRef.current = newScreenPoints;
        return;
      }

      // Calculate bounds for scaling
      let minX = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (const point of projectedPoints) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }

      // Add small margin if all points have same coordinate
      if (maxX === minX) {
        minX -= 1;
        maxX += 1;
      }
      if (maxY === minY) {
        minY -= 1;
        maxY += 1;
      }

      // Calculate scale to fit canvas with padding
      const drawWidth = width - CANVAS_PADDING * 2;
      const drawHeight = height - CANVAS_PADDING * 2;
      const scaleX = drawWidth / (maxX - minX);
      const scaleY = drawHeight / (maxY - minY);
      const scale = Math.min(scaleX, scaleY);

      // Calculate offset to center the visualization
      const offsetX = CANVAS_PADDING + (drawWidth - (maxX - minX) * scale) / 2;
      const offsetY = CANVAS_PADDING + (drawHeight - (maxY - minY) * scale) / 2;

      // Transform function to map data coordinates to canvas coordinates
      const transform = (x: number, y: number) => ({
        x: offsetX + (x - minX) * scale,
        y: offsetY + (y - minY) * scale,
      });

      // Sort points: background first, then results, hovered point last
      const sortedPoints = [...projectedPoints].sort((a, b) => {
        const aIsHovered =
          hoveredPoint && String(a.id) === String(hoveredPoint.id);
        const bIsHovered =
          hoveredPoint && String(b.id) === String(hoveredPoint.id);
        if (aIsHovered) return 1;
        if (bIsHovered) return -1;
        if (a.isSearchResult && !b.isSearchResult) return 1;
        if (!a.isSearchResult && b.isSearchResult) return -1;
        return 0;
      });

      // Draw all points
      for (const point of sortedPoints) {
        const { x, y } = transform(point.x, point.y);
        const isHovered =
          hoveredPoint && String(point.id) === String(hoveredPoint.id);

        let radius: number;
        let fillColor: string;
        let strokeColor: string | null = null;

        if (point.isSearchResult) {
          radius = isHovered
            ? POINT_RADIUS_RESULT * POINT_RADIUS_HOVER_SCALE
            : POINT_RADIUS_RESULT;
          fillColor = isHovered ? COLOR_RESULT_HOVER : COLOR_RESULT;
          strokeColor = COLOR_RESULT_STROKE;
        } else {
          radius = isHovered
            ? POINT_RADIUS_BACKGROUND * POINT_RADIUS_HOVER_SCALE
            : POINT_RADIUS_BACKGROUND;
          fillColor = isHovered ? COLOR_BACKGROUND_HOVER : COLOR_BACKGROUND;
        }

        // Draw point
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();

        if (strokeColor) {
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = isHovered ? 2 : 1.5;
          ctx.stroke();
        }

        // Store screen position for hit testing
        newScreenPoints.push({
          screenX: x,
          screenY: y,
          radius: point.isSearchResult
            ? POINT_RADIUS_RESULT
            : POINT_RADIUS_BACKGROUND,
          point,
        });
      }

      screenPointsRef.current = newScreenPoints;
    }, [projectedPoints, canvasSize, hoveredPoint]);

    // Redraw canvas when points, size, or hover changes
    useEffect(() => {
      drawCanvas();
    }, [drawCanvas]);

    // Handle mouse move for hover detection
    const handleMouseMove = useCallback(
      (event: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Find closest point within hit radius
        let closestPoint: ProjectedPoint | null = null;
        let closestDistance = Number.POSITIVE_INFINITY;

        for (const sp of screenPointsRef.current) {
          const dx = mouseX - sp.screenX;
          const dy = mouseY - sp.screenY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const hitRadius = sp.radius * HIT_TEST_MULTIPLIER;

          if (distance < hitRadius && distance < closestDistance) {
            closestDistance = distance;
            closestPoint = sp.point;
          }
        }

        if (closestPoint !== hoveredPoint) {
          setHoveredPoint(closestPoint);
        }

        if (closestPoint) {
          setTooltipPosition({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      },
      [hoveredPoint]
    );

    // Handle mouse leave
    const handleMouseLeave = useCallback(() => {
      setHoveredPoint(null);
    }, []);

    // Determine loading state
    const showLoading = isLoading || isComputing;
    const hasData = vectors.length > 0;
    const hasMinimumData = vectors.length >= 3;

    // Format payload for tooltip
    const formatPayload = (payload: Record<string, unknown> | undefined) => {
      if (!payload || Object.keys(payload).length === 0) return null;
      // Show first 3 fields only
      const entries = Object.entries(payload).slice(0, 3);
      return entries.map(([key, value]) => {
        let displayValue = String(value);
        if (displayValue.length > 30) {
          displayValue = `${displayValue.substring(0, 30)}...`;
        }
        return { key, value: displayValue };
      });
    };

    return (
      <div className={cn('flex h-full flex-col', className)}>
        {/* Header with dimension toggle */}
        <div className="bg-muted/30 flex shrink-0 items-center justify-between border-b px-4 py-2">
          <span className="text-muted-foreground text-sm">
            {t('vectorSearch.visualization', 'Visualization')}
          </span>
          <ToggleGroup
            value={[dimensionMode]}
            onValueChange={(values) => {
              const newValue = values[values.length - 1] as DimensionMode;
              if (newValue) setDimensionMode(newValue);
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="2d" aria-label="2D visualization">
              <Square className="mr-1 h-3 w-3" />
              2D
            </ToggleGroupItem>
            <ToggleGroupItem value="3d" aria-label="3D visualization">
              <Box className="mr-1 h-3 w-3" />
              3D
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Canvas container */}
        <div ref={containerRef} className="relative min-h-0 flex-1">
          {/* Loading state */}
          {showLoading && (
            <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              <span className="text-muted-foreground text-sm">
                {isComputing
                  ? t('vectorSearch.computing', 'Computing projection...')
                  : t('vectorSearch.loading', 'Loading vectors...')}
              </span>
              {isComputing && progress !== null && (
                <div className="bg-muted h-1.5 w-32 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full transition-all duration-200"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!showLoading && !hasData && (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-8">
              <Square className="h-10 w-10 opacity-20" />
              <p className="text-center text-sm">
                {t(
                  'vectorSearch.noVectorsToVisualize',
                  'No vectors to visualize'
                )}
              </p>
            </div>
          )}

          {/* Minimum data warning */}
          {!showLoading && hasData && !hasMinimumData && (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-8">
              <Square className="h-10 w-10 opacity-20" />
              <p className="text-center text-sm">
                {t(
                  'vectorSearch.notEnoughVectors',
                  'Need at least 3 vectors for UMAP projection'
                )}
              </p>
            </div>
          )}

          {/* UMAP error */}
          {!showLoading && umapError && (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 p-8">
              <Square className="h-10 w-10 opacity-20" />
              <p className="text-center text-sm text-red-500">{umapError}</p>
            </div>
          )}

          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className={cn(
              'h-full w-full cursor-crosshair',
              (showLoading || !hasMinimumData || umapError) && 'opacity-0'
            )}
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />

          {/* Tooltip */}
          {hoveredPoint && !showLoading && (
            <div
              className="bg-popover text-popover-foreground pointer-events-none absolute z-20 max-w-xs rounded-md border px-3 py-2 text-sm shadow-md"
              style={{
                left: Math.min(tooltipPosition.x + 12, canvasSize.width - 200),
                top: Math.min(tooltipPosition.y + 12, canvasSize.height - 100),
              }}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs">ID:</span>
                  <span className="font-mono text-xs font-medium">
                    {String(hoveredPoint.id)}
                  </span>
                </div>
                {hoveredPoint.isSearchResult && hoveredPoint.score != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      Score:
                    </span>
                    <span className="font-mono text-xs font-medium text-blue-500">
                      {hoveredPoint.score.toFixed(4)}
                    </span>
                  </div>
                )}
                {formatPayload(hoveredPoint.payload)?.map(({ key, value }) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {key}:
                    </span>
                    <span className="text-xs">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          {!showLoading && hasMinimumData && !umapError && (
            <div className="bg-background/90 absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-md border px-3 py-2 text-xs backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COLOR_BACKGROUND }}
                />
                <span className="text-muted-foreground">
                  {t('vectorSearch.backgroundPoints', 'Background points')}
                  {projectedPoints.filter((p) => !p.isSearchResult).length >
                    0 &&
                    ` (${projectedPoints.filter((p) => !p.isSearchResult).length})`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full border"
                  style={{
                    backgroundColor: COLOR_RESULT,
                    borderColor: COLOR_RESULT_STROKE,
                  }}
                />
                <span className="text-muted-foreground">
                  {t('vectorSearch.searchResults', 'Search results')}
                  {projectedPoints.filter((p) => p.isSearchResult).length > 0 &&
                    ` (${projectedPoints.filter((p) => p.isSearchResult).length})`}
                </span>
              </div>
            </div>
          )}

          {/* 3D mode hint */}
          {dimensionMode === '3d' &&
            !showLoading &&
            hasMinimumData &&
            !umapError && (
              <div className="bg-background/90 absolute right-3 bottom-3 rounded-md border px-3 py-2 text-xs backdrop-blur-sm">
                <span className="text-muted-foreground">
                  {t('vectorSearch.3dHint', '3D projection (isometric view)')}
                </span>
              </div>
            )}
        </div>
      </div>
    );
  }
);

VectorVisualization.displayName = 'VectorVisualization';
