// @ts-ignore
// Virtual entry point for the app
import * as remixBuild from '@remix-run/dev/server-build';
import type {FilterDefault} from '@sanity/client';
import {createAdminApiClient} from '@shopify/admin-api-client';
import {
  cartGetIdDefault,
  cartSetIdDefault,
  createCartHandler,
  createStorefrontClient,
  storefrontRedirect,
} from '@shopify/hydrogen';
import {
  createCookie,
  createCookieSessionStorage,
  createRequestHandler,
  getStorefrontHeaders,
  type Session,
  type SessionStorage,
} from '@shopify/remix-oxygen';
import {createSanityContext} from 'hydrogen-sanity';
import {PreviewSession} from 'hydrogen-sanity/preview/session';
export const filter: FilterDefault = (props) => {
  return props.filterDefault(props);
};

// import {I18nLocale} from '~/types/shopify';
import {createSwymApiClient} from '~/lib/swym/api/createSwymApiClient.server';
import {
  DEFAULT_LOCALE,
  extractClientInfo,
  getLocaleFromCountryCode,
  getLocaleFromRequestUrl,
  // returnAustrianServerInfoForDev,
} from '~/lib/utils';
import {EXTENDED_CART_FRAGMENT} from '~/queries/shopify/product';
import {XGEN_DEBUG_PARAM_NAME} from '~/utils/constants';

import {SHOPIFY_ADMIN_LOCATIONS} from './app/queries/shopify/inventory';

// reduce the running time of sync inventory process in PDP, PLP and cart page.
let shopifyDefaultLocationId = '';
/**
 * Export a fetch handler in module format.
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    executionContext: ExecutionContext,
  ): Promise<Response> {
    const waitUntil = (p: Promise<any>) => executionContext.waitUntil(p);
    const debugLogs: string[] = [];
    let resolveDebugLogs: (logs: string[]) => void = () => {};
    const debugLogsPromise = new Promise<string[]>((resolve) => {
      resolveDebugLogs = resolve;
    });
    let debugEnabled = false;

    try {
      // Redirect trailing slashes to non-trailing slashes.
      const url = new URL(request.url);
      let pathChanged = false;
      if (url.pathname.includes('//')) {
        url.pathname = url.pathname.replace(/\/{2,}/g, '/');
        pathChanged = true;
      }
      // remove trailing slashes, except for root
      if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
        url.pathname = url.pathname.slice(0, -1);
        pathChanged = true;
      }

      if (pathChanged) {
        resolveDebugLogs([]);
        return Response.redirect(url.toString(), 301);
      }

      debugEnabled = url.searchParams.has(XGEN_DEBUG_PARAM_NAME);

      /**
       * Open a cache instance in the worker and a custom session instance.
       */
      if (!env?.SESSION_SECRET) {
        throw new Error('SESSION_SECRET environment variable is not set');
      }

      const [cache, session, previewSession] = await Promise.all([
        caches.open('hydrogen'),
        HydrogenSession.init(request, [env.SESSION_SECRET]),
        PreviewSession.init(request, [env.SESSION_SECRET]),
      ]);

      // JME-351 - For development, we want to force the server to think it's in Austria
      // const ipData = returnAustrianServerInfoForDev(request);
      // const pathPrefixLocale: I18nLocale = {
      //   label: 'USA',
      //   language: 'EN',
      //   country: 'US',
      //   currency: 'USD',
      //   pathPrefix: '',
      // };

      // Extract client information from the incoming request using custom utility function.
      const ipData = extractClientInfo(request);

      // Extract the country code from the IP data. If no country code is available, `ipCountry` will be undefined.
      const ipCountry = ipData.country;

      // Attempt to match the IP country code with a locale from the shop's defined locales.
      // If `ipCountry` is undefined or no matching locale is found, default to the shop's default locale.
      const ipLocale = ipCountry
        ? getLocaleFromCountryCode(ipCountry)
        : DEFAULT_LOCALE;

      // Determine the locale from the URL path prefix (e.g., "/en-ca") to indicate the user's selected region/currency.
      const pathPrefixLocale = getLocaleFromRequestUrl(request.url);

      // Check if the country code derived from the IP matches the country code derived from the URL path prefix.
      // This is used to determine if the user's apparent IP-based locale aligns with the locale suggested by the URL they are visiting.
      const ipMatchesPathPrefix =
        pathPrefixLocale.country.toLowerCase() === ipCountry?.toLowerCase();

      // Determine the most appropriate storefront locale to use based on whether the IP country matches the path prefix country.
      // If they match, it suggests that the user is correctly located within the locale suggested by the path prefix.
      // If not, use the locale suggested by the path prefix as it might be a user's deliberate choice (e.g., switching from a default or different locale).
      const storefrontLocale = ipMatchesPathPrefix
        ? ipLocale
        : pathPrefixLocale;
      // Retrieve the 'Cookie' header from the request to parse locale confirmation details.
      const cookieHeader = request.headers.get('Cookie');
      let localeConfirmationCookieValue, oxygenServerRequestCountry;
      let isIpLocaleConfirmedInCookie = false;

      try {
        // Parse the locale confirmation cookie to retrieve previously stored locale confirmation data.
        localeConfirmationCookieValue = await localeConfirmationCookie.parse(
          cookieHeader,
        );

        if (localeConfirmationCookieValue) {
          // Grab country from request headers
          oxygenServerRequestCountry = request.headers.get(
            'oxygen-buyer-country',
          );
          // Check if the locale confirmation cookie explicitly confirms the user's locale matches the buyer country identified in the request headers.
          if (
            oxygenServerRequestCountry &&
            localeConfirmationCookieValue[oxygenServerRequestCountry]
          ) {
            // Country is in the cookie--confirmed
            isIpLocaleConfirmedInCookie = true;
          }
        }
      } catch (error) {
        console.error('Error parsing the locale confirmation cookie:', error);
      }

      /**
       * Construct a locale data object to be passed into the Remix context.
       * This object consolidates locale-related data derived from IP, URL path prefix, and cookie confirmations.
       */
      const localeData = {
        ipMatchesPathPrefix,
        ipLocale,
        pathPrefixLocale,
        storefrontLocale,
        localeConfirmationCookieValue,
        isIpLocaleConfirmedInCookie,
      };

      /**
       * Create Hydrogen's Storefront client.
       */
      const {storefront} = createStorefrontClient({
        cache,
        waitUntil,
        i18n: storefrontLocale,
        publicStorefrontToken: env.PUBLIC_STOREFRONT_API_TOKEN,
        privateStorefrontToken: env.PRIVATE_STOREFRONT_API_TOKEN,
        storeDomain: `https://${env.PUBLIC_STORE_DOMAIN}`,
        storefrontApiVersion: env.PUBLIC_STOREFRONT_API_VERSION || '2023-10',
        storefrontId: env.PUBLIC_STOREFRONT_ID,
        storefrontHeaders: getStorefrontHeaders(request),
      });

      const adminApiClient = createAdminApiClient({
        storeDomain: env.PUBLIC_STORE_DOMAIN,
        apiVersion: '2024-10',
        accessToken: env.PRIVATE_ADMIN_API_TOKEN,
      });
      if (shopifyDefaultLocationId == '') {
        shopifyDefaultLocationId = `gid://shopify/Location/${env.ECOM_LOCATION_ID}`;
      }

      const workspace = 'production';
      const studioUrl =
        process.env.NODE_ENV === 'production'
          ? `https://linen-lion.sanity.studio/production`
          : `http://localhost:3333/${workspace}`;

      const sanity = createSanityContext({
        cache,
        waitUntil,
        request,
        client: {
          projectId: env.SANITY_PROJECT_ID,
          dataset: env.SANITY_DATASET,
          apiVersion: env.SANITY_API_VERSION ?? '2025-02-19',
          useCdn: process.env.NODE_ENV === 'production',
          stega: {
            studioUrl,
          },
        },
        preview: env.SANITY_API_TOKEN
          ? {
              token: env.SANITY_API_TOKEN,
              studioUrl,
              session: previewSession,
            }
          : undefined,
      });

      // Create a cart api instance.
      const cart = createCartHandler({
        storefront,
        getCartId: cartGetIdDefault(request.headers),
        setCartId: cartSetIdDefault(),
        cartQueryFragment: EXTENDED_CART_FRAGMENT,
      });

      /**
       * Create a Swym API client instance.
       */
      const swymApiClient = createSwymApiClient({
        request,
        session,
        env,
      });

      /**
       * Create a Remix request handler and pass
       * Hydrogen's Storefront client to the loader context.
       */
      const handleRequest = createRequestHandler({
        build: remixBuild,
        mode: process.env.NODE_ENV,
        getLoadContext: () => ({
          session,
          waitUntil,
          storefront,
          cart,
          env,
          sanity,
          ipData,
          localeData,
          adminApiClient,
          shopifyDefaultLocationId,
          swymApiClient,
          xgenDebug: {
            enabled: debugEnabled,
            logs: debugLogs,
            promise: debugLogsPromise,
          },
        }),
      });

      const response = await handleRequest(request);

      resolveDebugLogs([...debugLogs]);

      const sessionCookie = await session.commit();
      if (sessionCookie) {
        response.headers.append('Set-Cookie', sessionCookie);
      }

      // Security headers (CSP is now handled in entry.server.tsx with nonce support)
      const isProduction =
        process.env.NODE_ENV === 'production' ||
        request.url.includes('jmclaughlin.com');

      response.headers.set('X-Content-Type-Options', 'nosniff');

      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set(
        'Referrer-Policy',
        'strict-origin-when-cross-origin',
      );

      // Add HSTS header for production (HTTPS enforcement)
      if (isProduction) {
        response.headers.set(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains',
        );
      }

      if (response.status === 404) {
        /**
         * Check for redirects only when there's a 404 from the app.
         * If the redirect doesn't exist, then `storefrontRedirect`
         * will pass through the 404 response.
         */
        return storefrontRedirect({request, response, storefront});
      }

      return response;
    } catch (error) {
      console.error(error);
      resolveDebugLogs([...debugLogs]);
      return new Response('An unexpected error occurred', {status: 500});
    }
  },
};

/**
 * This is a custom session implementation for your Hydrogen shop.
 * Feel free to customize it to your needs, add helper methods, or
 * swap out the cookie-based implementation with something else!
 */
class HydrogenSession {
  constructor(
    private sessionStorage: SessionStorage,
    private session: Session,
  ) {}

  static async init(request: Request, secrets: string[]) {
    const storage = createCookieSessionStorage({
      cookie: {
        name: 'session',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secrets,
        maxAge: 15552000000,
      },
    });

    const session = await storage.getSession(request.headers.get('Cookie'));

    return new this(storage, session);
  }

  get(key: string) {
    return this.session.get(key);
  }

  destroy() {
    return this.sessionStorage.destroySession(this.session);
  }

  flash(key: string, value: any) {
    this.session.flash(key, value);
  }

  unset(key: string) {
    this.session.unset(key);
  }

  set(key: string, value: any) {
    this.session.set(key, value);
  }

  commit() {
    return this.sessionStorage.commitSession(this.session);
  }
}

export const localeConfirmationCookie = createCookie('localeConfirmation', {
  maxAge: 2592000, // 30 days in seconds
  httpOnly: true,
  secure: false,
});
