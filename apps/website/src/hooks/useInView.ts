import { useEffect, useRef, useState } from 'react';

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseInViewReturn<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  isInView: boolean;
}

/**
 * Hook that uses IntersectionObserver to detect when an element is in view.
 *
 * @param options.threshold - Percentage of element visible to trigger (default: 0.2)
 * @param options.rootMargin - Margin around the root (default: '0px 0px -50px 0px')
 * @param options.triggerOnce - Only trigger once, then stay visible (default: true)
 * @returns { ref, isInView } - Ref to attach to element and visibility state
 */
export function useInView<T extends HTMLElement = HTMLElement>(
  options: UseInViewOptions = {}
): UseInViewReturn<T> {
  const {
    threshold = 0.2,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
  } = options;

  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // If already triggered and triggerOnce is true, don't observe
    if (isInView && triggerOnce) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (triggerOnce) {
              observer.unobserve(element);
            }
          } else if (!triggerOnce) {
            setIsInView(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, isInView]);

  return { ref, isInView };
}
