import {Ref} from 'react';

import {useXgenClient} from '~/contexts/XgenClientContext';
import useElementInViewOnce from '~/hooks/useElementInViewOnce';

type ClickExtractionOptions = {
  // CSS selector to find the clickable product container
  selector?: string; // default: '[data-item]'
  // Attribute on the element to read item code from
  attr?: string; // default: 'data-item'
};

type UseTrackElementInteractionsOptions = {
  elementId: string; // XGen element ID (deployment ID or pod/experience ID), not DOM element ID.
  items?: string[]; // optional list of item codes to attach to render/view events
  enabled?: boolean;
  threshold?: number;
  // Allow external ref attachment if desired
  externalRef?: Ref<Element | null>;
  // Click handling
  click?: {
    extract?: ClickExtractionOptions; // how to pull the clicked item code
    once?: boolean; // default false (allow repeated clicks)
    // Additional context to send with click events
    context?: Record<string, unknown>;
  };
  // Extra context to include in render/view events
  context?: Record<string, unknown>;
  // Reset tracking when this key changes (e.g., route segment, elementId, resultId)
  resetKey?: unknown;
  // Selectively enable or disable which interactions to track
  track?: {
    render?: boolean; // default true
    view?: boolean; // default true
    click?: boolean; // default true
  };
};

/**
 * Wraps useElementInViewOnce and XGen client tracking into one reusable hook.
 * Tracks elementRender on mount, elementView on first in-view, and delegates click events.
 *
 * Example:
 *   const {ref} = useTrackElementInteractions({
 *     elementId: podId,
 *     items: results.map(r => r.data.shopify_id?.toString() || ''),
 *   });
 *   return <div ref={ref}>...</div>
 */
export function useTrackElementInteractions({
  elementId,
  items = [],
  enabled = true,
  threshold = 0,
  externalRef,
  click,
  context,
  resetKey,
  track,
}: UseTrackElementInteractionsOptions) {
  const xgenClient = useXgenClient();

  const clickSelector = click?.extract?.selector ?? '[data-item]';
  const clickAttr = click?.extract?.attr ?? 'data-item';
  const clickOnce = click?.once ?? false; // default to allow repeated clicks

  const trackCfg = {
    render: track?.render !== false,
    view: track?.view !== false,
    click: track?.click !== false,
  } as const;

  const {ref, setNodeRef, inView, reset} = useElementInViewOnce({
    threshold,
    externalRef,
    enabled,
    resetKey,
    onRenderOnce: trackCfg.render
      ? () => {
          if (!xgenClient || !enabled) return;
          xgenClient.track.elementRender({
            element: {
              id: elementId,
              items,
            },
            context,
          });
        }
      : undefined,
    onInViewOnce: trackCfg.view
      ? () => {
          if (!xgenClient || !enabled) return;
          xgenClient.track.elementView({
            element: {
              id: elementId,
              items,
            },
            context,
          });
        }
      : undefined,
    onClick: trackCfg.click
      ? {
          handler: (e: MouseEvent) => {
            if (!xgenClient || !enabled) return;
            const target = e.target as Element | null;
            const el = target?.closest(clickSelector) as HTMLElement | null;
            const itemCode = el?.getAttribute(clickAttr) || undefined;
            if (!itemCode) return;

            xgenClient.track.elementClick({
              element: {
                id: elementId,
                items,
              },
              item: itemCode,
              context: click?.context,
            });
          },
          once: clickOnce,
        }
      : undefined,
  });

  return {ref, setNodeRef, inView, reset};
}

export default useTrackElementInteractions;
