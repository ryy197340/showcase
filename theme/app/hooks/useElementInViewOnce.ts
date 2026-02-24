import {
  MutableRefObject,
  Ref,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import {IntersectionOptions, useInView} from 'react-intersection-observer';

type ExternalRef = Ref<Element | null>;

type UseElementInViewOnceOptions = IntersectionOptions & {
  elementId?: string;
  externalRef?: ExternalRef;
  onRenderOnce?: () => void;
  onInViewOnce?: () => void;
  onClick?:
    | ((event: MouseEvent) => void)
    | {
        handler: (event: MouseEvent) => void;
        once?: boolean; // defaults to true
      };
  enabled?: boolean;
};

/**
 * Observe a DOM element (by id or via returned ref) and fire:
 * - onRenderOnce: once after mount (per component instance)
 * - onInViewOnce: once when the element enters the viewport
 *
 * Usage by id only:
 *   useElementInViewOnce({ elementId: 'recommendations', onRenderOnce, onInViewOnce })
 *
 * Usage with returned ref:
 *   const { setNodeRef, inView } = useElementInViewOnce({ onRenderOnce, onInViewOnce })
 *   return <div ref={setNodeRef} />
 */
export function useElementInViewOnce({
  elementId,
  externalRef,
  onRenderOnce,
  onInViewOnce,
  onClick,
  enabled = true,
  threshold = 0,
  root,
  rootMargin,
  trackVisibility,
  delay,
  initialInView,
  fallbackInView,
  // Allow callers to force a logical "remount" of once-only behaviors
  // by changing this key or calling the returned reset() function.
  resetKey,
}: UseElementInViewOnceOptions & {resetKey?: unknown}) {
  const {ref: observerRef, inView} = useInView({
    threshold,
    root,
    rootMargin,
    trackVisibility,
    delay,
    initialInView,
    fallbackInView,
    // don't auto-trigger once; we manage once semantics so we can reset later
    triggerOnce: false,
  });

  // Merge provided ref callback with observer's ref and keep latest node
  const nodeRef = useRef<Element | null>(null);
  const mergedRef = useCallback(
    (node: Element | null) => {
      // Forward to any external ref provided (object or callback)
      if (externalRef) {
        if (typeof externalRef === 'function') {
          externalRef(node);
        } else if (typeof externalRef === 'object' && externalRef !== null) {
          // MutableRefObject has writable current; RefObject is readonly in types
          (externalRef as MutableRefObject<Element | null>).current = node;
        }
      }
      // observerRef is a callback ref from useInView
      (observerRef as unknown as (node: Element | null) => void)(node);
      nodeRef.current = node;
    },
    [externalRef, observerRef],
  );

  const renderFiredRef = useRef(false);
  const inViewFiredRef = useRef(false);

  // Fire on render once per component instance
  useEffect(() => {
    if (!enabled) return;
    if (!renderFiredRef.current) {
      onRenderOnce?.();
      renderFiredRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, resetKey, elementId]);

  // Attach the observer to an external ref or element id if provided
  useEffect(() => {
    if (!enabled) return;
    // If an external ref object has a current value, attach observer to it
    if (
      externalRef &&
      typeof externalRef === 'object' &&
      (externalRef as RefObject<Element | null>).current
    ) {
      mergedRef((externalRef as RefObject<Element | null>).current);
      return;
    }
    if (elementId) {
      if (typeof document === 'undefined') return;
      const el = document.getElementById(elementId);
      if (el) mergedRef(el);
    }
  }, [elementId, externalRef, enabled, mergedRef]);

  // Fire once when element enters view
  useEffect(() => {
    if (!enabled) return;
    if (inView && !inViewFiredRef.current) {
      onInViewOnce?.();
      inViewFiredRef.current = true;
    }
  }, [enabled, inView, onInViewOnce, resetKey, elementId]);

  // Handle click events (optionally once)
  const clickFiredRef = useRef(false);
  useEffect(() => {
    if (!enabled) return;
    if (!onClick) return;
    const el = nodeRef.current as Element | null;
    if (!el) return;

    const handler = (e: Event) => {
      const isFn = typeof onClick === 'function';
      const fn = isFn ? onClick : onClick.handler;
      const once = isFn ? true : onClick.once !== false; // default true
      if (once && clickFiredRef.current) return;
      clickFiredRef.current = true;
      fn(e as MouseEvent);
    };

    el.addEventListener('click', handler as EventListener, {passive: true});
    return () => {
      el.removeEventListener('click', handler as EventListener);
    };
  }, [enabled, onClick, resetKey, elementId]);

  // Manual reset API and key-driven reset support
  const [, setResetSeed] = useState(0);
  const reset = useCallback(() => {
    renderFiredRef.current = false;
    inViewFiredRef.current = false;
    clickFiredRef.current = false;
    setResetSeed((s) => s + 1);
  }, []);

  useEffect(() => {
    // Reset when key or element id changes
    renderFiredRef.current = false;
    inViewFiredRef.current = false;
    clickFiredRef.current = false;
  }, [resetKey, elementId]);

  return {ref: mergedRef, setNodeRef: mergedRef, inView, reset};
}

export default useElementInViewOnce;
