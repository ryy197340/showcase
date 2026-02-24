import {AppLoadContext} from '@shopify/remix-oxygen';
import XGenClient, {
  GetCategoryPageParams,
  GetResultsParams,
  LocalCookieAuthStore,
  RecommendProduct,
  RecommendResultParams,
} from '@xgenai/sdk-core';

import {XgenConfigType} from '~/lib/xgen/types';
import formatLocale from '~/lib/xgen/utils/formatLocale';
import {XgenIds} from '~/root';

type DebugFetchOptions = RequestInit & {
  headers?: Headers;
  body?: RequestInit['body'] | Record<string, unknown> | unknown;
};

type DebugMessageType = 'SERVER' | 'CLIENT';

const xgenClientCache = new WeakMap<AppLoadContext, XGenClient>();

function buildCurlCommand(url: string, options: DebugFetchOptions) {
  const headers = Object.fromEntries(options.headers?.entries() ?? []);
  const body = options.body ? JSON.stringify(options.body) : '';
  const method = options.method || 'POST';

  return (
    'curl -X ' +
    method +
    " '" +
    url +
    "' " +
    (Object.keys(headers).length > 0
      ? ' \\\n  ' +
        Object.entries(headers)
          .map(([key, value]) => "-H '" + key + ': ' + value + "'")
          .join(' \\\n  ')
      : '') +
    ' \\\n  -d ' +
    body
  );
}

function getConsoleStyles(type: DebugMessageType) {
  const baseStyle =
    'background:#0f172a;color:#f8fafc;padding:2px 8px;border-radius:4px;';
  const typeStyle =
    type === 'SERVER'
      ? 'background:#047857;color:#ecfdf5;padding:2px 8px;border-radius:4px;'
      : 'background:#2563eb;color:#eff6ff;padding:2px 8px;border-radius:4px;';
  const urlStyle = 'color:#2563eb;font-weight:bold;';
  const messageStyle = 'color:inherit;';

  return {baseStyle, typeStyle, urlStyle, messageStyle};
}

function extractUrlFromCurl(message: string): string | null {
  const match = message.match(/curl\s+-X\s+\w+\s+'([^']+)'/i);
  return match?.[1] ?? null;
}

export function logDebugMessage(
  message: string,
  type: DebugMessageType,
  requestUrl?: string,
) {
  const formatted = `[${type}] XGEN REQUEST DEBUG:\n\n${message}\n\n`;

  if (typeof window === 'undefined') {
    // eslint-disable-next-line no-console
    console.debug(formatted);
    return;
  }

  const {baseStyle, typeStyle, urlStyle, messageStyle} = getConsoleStyles(type);
  const targetUrl = requestUrl ?? extractUrlFromCurl(message);

  // eslint-disable-next-line no-console
  if (typeof console.groupCollapsed === 'function') {
    const label = targetUrl
      ? `%cXGEN%c ${type}%c ${targetUrl}`
      : `%cXGEN%c ${type}`;
    const styles = targetUrl
      ? [baseStyle, typeStyle, urlStyle]
      : [baseStyle, typeStyle];

    // eslint-disable-next-line no-console
    console.groupCollapsed(label, ...styles);
    // eslint-disable-next-line no-console
    console.log(`%c${message}`, messageStyle);
    // eslint-disable-next-line no-console
    console.groupEnd();
    return;
  }

  // eslint-disable-next-line no-console
  console.debug(formatted);
}

export function createDebugFetch(context?: AppLoadContext) {
  return function xgenDebugFetch(url: string, options: DebugFetchOptions) {
    const serverDebugEnabled =
      typeof window === 'undefined' && Boolean(context?.xgenDebug?.enabled);
    const clientDebugEnabled =
      typeof window !== 'undefined' && Boolean(window.__XGEN_DEBUG_LOGS);
    const msgType: DebugMessageType = serverDebugEnabled ? 'SERVER' : 'CLIENT';

    if (!serverDebugEnabled && !clientDebugEnabled) {
      return fetch(url, options);
    }

    const message = buildCurlCommand(url, options);

    logDebugMessage(message, msgType, url);

    if (serverDebugEnabled && context?.xgenDebug) {
      context.xgenDebug.logs.push(message);
    }

    return fetch(url, options);
  };
}

export const debugFetch = createDebugFetch();

export function getXgenConfig(
  context: AppLoadContext,
): XgenConfigType & XgenIds {
  return {
    key: context.env.XGEN_KEY!,
    secret: context.env.XGEN_SECRET!,
    clientId: context.env.XGEN_CLIENT_ID!,
    trackerId: context.env.XGEN_TRACKER_ID!,
    deploymentId: context.env.XGEN_DEPLOYMENT_ID!,
    plpDeploymentId: context.env.XGEN_PLP_DEPLOYMENT_ID!,
    domain: context.env.WILDCARD_DOMAIN!, // domain is used to allow tracking the user's on checkout pages
    hpBestSellersId: context.env.XGEN_HP_BEST_SELLERS_ID!,
    trendingId: context.env.XGEN_TRENDING_ID!,
    getLocale: () => {
      // Return a default locale or get from context if available
      return {
        country: 'US',
        language: 'en',
        currency: 'USD',
      };
    },
  };
}

export function getXgenClient(context: AppLoadContext): XGenClient {
  const xgenConfig = getXgenConfig(context);
  const existingClient = xgenClientCache.get(context);
  if (existingClient) {
    return existingClient;
  }

  const fetchFunc =
    typeof window === 'undefined'
      ? (createDebugFetch(context) as typeof fetch)
      : (debugFetch as typeof fetch);

  const authStore = new LocalCookieAuthStore({
    cookieOptions: {
      domain: xgenConfig.domain ?? '.jmclaughlin.com',
    },
  });

  const client = new XGenClient({
    ...xgenConfig,
    locale: formatLocale(xgenConfig.locale),
    fetchFunc,
    authStore,
  });

  xgenClientCache.set(context, client);

  return client;
}

export async function getRecommendations(
  context: AppLoadContext,
  params: RecommendResultParams,
) {
  const {elementIds, options, queryId} = params;

  const xgen = getXgenClient(context);
  const recommendations = await xgen.recommend.getResults({
    elementIds,
    options,
    queryId,
  });

  // TODO: may need mapped to a different structure

  return recommendations;
}

export async function getSearchResults(
  context: AppLoadContext,
  params: GetResultsParams,
) {
  const xg = getXgenClient(context);
  const searchResults = await xg.search.getResults(params);

  return searchResults;
}

export async function getCategoryPage(
  context: AppLoadContext,
  params: GetCategoryPageParams,
) {
  const xg = getXgenClient(context);
  const searchResults = await xg.search.getCategoryPage(params);

  return searchResults;
}

export async function getInitialRecommendations(
  context: AppLoadContext,
  trendingId?: string,
): Promise<RecommendProduct[] | null> {
  if (!trendingId) return null;

  try {
    const xgen = getXgenClient(context);
    const data = await xgen.recommend.getResultsById({elementId: trendingId});

    const items = data.items.map((item) => {
      const availableVariants = item?.variants?.filter(
        (variant: any) => variant.available === true,
      );
      const url = availableVariants[0]?.url;
      return {...item, url};
    });

    return items;
  } catch (error) {
    console.error('Error fetching initial recommendations:', error);
    return null;
  }
}
