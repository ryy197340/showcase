import {useLocation} from '@remix-run/react';
import {type ShopifyPageViewPayload} from '@shopify/hydrogen';
import {useEffect, useRef} from 'react';

import {stripGlobalId} from '~/utils';

import {useCustomLoadScript} from './useCustomLoadScript';
import {useCustomLoadStylesheet} from './useCustomLoadStylesheet';
import useDataFromMatches from './useDataFromMatches';

export function useVideowise(shop: string) {
  useCustomLoadStylesheet('https://assets.videowise.com/style.css.gz', {
    id: 'videowise-style-css',
  });

  useCustomLoadScript(
    '',
    {
      in: 'head',
      content: `
        var SKIP_CART = true;
        var FORCE_DOMAIN = true;
        var VIDEOWISE_FAST_INLINE_VIDEO_PLAYER = true;
        var Shopify = Shopify || {
          shop: "${shop}",
          currency: {
            active: "USD",
            rate: "1.0"
          }
        };
      `,
    },
    'VideoWiseBodyScript',
  );

  useCustomLoadScript('https://assets.videowise.com/vendors.js.gz', {
    in: 'body',
    async: false,
    id: 'videowise-vendors-js',
  });

  useCustomLoadScript('https://assets.videowise.com/client.js.gz', {
    in: 'body',
    async: false,
    id: 'videowise-client-js',
    onLoadCallback: async () => {
      if (typeof window.initVideowise === 'function') {
        setTimeout(() => {
          window.initVideowise();
        }, 500);
      }
    },
  });

  useCustomLoadScript('https://assets.videowise.com/videowise-jmc.js', {
    in: 'body',
    async: false,
    id: 'videowise-jmc-js',
  });

  const location = useLocation();
  const analyticsFromMatches = useDataFromMatches(
    'analytics',
  ) as unknown as ShopifyPageViewPayload;

  // Page view analytics
  // We want useEffect to execute only when location changes
  // which represents a page view
  const lastLocationKey = useRef('');

  useEffect(() => {
    // Only continue if the user's location changed.
    if (lastLocationKey.current === location.key) return;
    lastLocationKey.current = location.key;

    // Begin VideoWise
    if (location.pathname.includes('/products/')) {
      // Product Page View
      if (
        analyticsFromMatches &&
        analyticsFromMatches.products &&
        analyticsFromMatches.products.length > 0
      ) {
        window.__st = {
          rid: stripGlobalId(analyticsFromMatches.products[0]?.productGid),
          p: 'product',
        };
      }
    } else {
      // Non product page
      window.__st = {p: 'page', rid: null};
    }

    if (typeof window.initVideowise === 'function') {
      setTimeout(() => {
        window.initVideowise();
      }, 500);
    }

    // Find all muted videos that are set to autoplay and try to play them
    setTimeout(() => {
      const videos = document.querySelectorAll('video[muted][autoplay]');
      // Try to play each video found
      videos.forEach((video) => {
        video.play().catch((error) => {
          console.error('Error attempting to play video:', error);
        });
      });
    }, 500);

    // End VideoWise
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);
}
