import { useImperativeHandle, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface GhostResizeLineRef {
  show: (left: number, bounds?: { top: number; height: number }) => void;
  hide: () => void;
  setPosition: (left: number) => void;
}

/**
 * A lightweight ghost line component for column resize preview.
 * Uses direct DOM manipulation for zero-rerender performance during drag.
 * Renders via Portal to avoid CSS transform issues with fixed positioning.
 */
export const GhostResizeLine = function GhostResizeLine({
  ref,
}: {
  ref?: React.RefObject<GhostResizeLineRef | null>;
}) {
  const lineRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    show: (left: number, bounds?: { top: number; height: number }) => {
      if (lineRef.current) {
        lineRef.current.style.display = 'block';
        lineRef.current.style.left = `${left}px`;
        if (bounds) {
          lineRef.current.style.top = `${bounds.top}px`;
          lineRef.current.style.height = `${bounds.height}px`;
          lineRef.current.style.bottom = 'auto';
        } else {
          lineRef.current.style.top = '0';
          lineRef.current.style.bottom = '0';
          lineRef.current.style.height = 'auto';
        }
      }
    },
    hide: () => {
      if (lineRef.current) {
        lineRef.current.style.display = 'none';
      }
    },
    setPosition: (left: number) => {
      if (lineRef.current) {
        lineRef.current.style.left = `${left}px`;
      }
    },
  }));

  // Use Portal to render at document.body level to avoid CSS transform issues
  return createPortal(
    <div
      ref={lineRef}
      className="bg-primary pointer-events-none fixed w-0.5"
      style={{ display: 'none', zIndex: 9999 }}
      aria-hidden="true"
    />,
    document.body
  );
};
