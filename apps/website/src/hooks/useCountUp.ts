import { useEffect, useRef, useSyncExternalStore } from 'react';

interface UseCountUpOptions {
  end: number;
  duration?: number;
  start?: number;
  enabled?: boolean;
}

/**
 * Hook that animates a number counting up from start to end.
 * Uses requestAnimationFrame with ease-out cubic easing.
 */
export function useCountUp({
  end,
  duration = 1500,
  start = 0,
  enabled = true,
}: UseCountUpOptions) {
  const countRef = useRef(start);
  const subscribersRef = useRef(new Set<() => void>());

  const subscribe = (callback: () => void) => {
    subscribersRef.current.add(callback);
    return () => subscribersRef.current.delete(callback);
  };

  const getSnapshot = () => countRef.current;

  useEffect(() => {
    if (!enabled) {
      countRef.current = start;
      for (const cb of subscribersRef.current) cb();
      return;
    }

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease-out cubic
      const eased = 1 - (1 - progress) ** 3;
      const newCount = Math.floor(start + (end - start) * eased);

      if (newCount !== countRef.current) {
        countRef.current = newCount;
        for (const cb of subscribersRef.current) cb();
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, start, enabled]);

  return useSyncExternalStore(subscribe, getSnapshot);
}
