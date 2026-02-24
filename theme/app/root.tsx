// eslint-disable-next-line simple-import-sort/imports
import {cssBundleHref} from '@remix-run/css-bundle';
import stylesheet from '~/styles/tailwind.css?url';
import {
  Fetcher,
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  NavigateFunction,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetcher,
  useLoaderData,
  useLocation,
  useMatches,
  useNavigate,
  useRevalidator,
  useRouteError,
} from '@remix-run/react';
import {
  CartForm,
  Seo,
  type SeoHandleFunction,
  ShopifySalesChannel,
} from '@shopify/hydrogen';
import type {
  Collection,
  Customer,
  Shop,
} from '@shopify/hydrogen/storefront-api-types';
import {ShopifyProvider} from '@shopify/hydrogen-react';
import {
  defer,
  LinksFunction,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {VisualEditing} from 'hydrogen-sanity/visual-editing';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';

import {GenericError} from '~/components/global/GenericError';
import {Layout} from '~/components/global/Layout';
import {NotFound} from '~/components/global/NotFound';
import {SeoIndexingTags} from '~/components/modules/SeoIndexingTags';
import {XgenClientProvider} from '~/contexts/XgenClientContext';
import {useAnalytics} from '~/hooks/useAnalytics';
import {useCustomLoadScript} from '~/hooks/useCustomLoadScript';
import {useVideowise} from '~/hooks/useVideowise';
import {useNonce} from '~/lib/nonce';
import {SwymProvider} from '~/lib/swym/context/SwymContext';

import {
  createLocales,
  DEFAULT_LOCALE,
  getLocaleFromRequestUrl,
  GlobalContext,
  Locales,
  postLocaleCookie,
  SHOP_QUERY,
  storeLocaleInLocalStorage,
  updateBuyerIdentity,
  updateFreeShippingBanner,
} from '~/lib/utils';
import type {XgenConfigType} from '~/lib/xgen/types';
import {LAYOUT_QUERY} from '~/queries/sanity/layout';
import {COLLECTION_QUERY_ID} from '~/queries/shopify/collection';
import type {CustomLocalizationType, I18nLocale} from '~/types/shopify';
//import { pushUserDataNew } from '~/utils/gtmEvents';     // //PEAK ACTIVITY
import {handleGtmClick, pushPageLoadedEvent} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITIONS STARTS

import {localePrefixUpdate} from './components/global/localizationSelector/utils';
import useGlobalEUpdateOrCookiePost from './hooks/useGlobalEUpdateOrCookiePost';
import useLocaleDetermination from './hooks/useLocaleDetermination';
import useUpdateGlobalEParams from './hooks/useUpdateGlobalEParams';
import {GlobalSchemas, HOME_BREADCRUMB, SchemaTag} from './lib/schema';
import {
  initBazaarVoice,
  initReferralCandy,
  JME622SizeChart,
} from './lib/thirdParty';
import {getCustomer} from './routes/($lang).account';
import {sha1, stripGlobalId} from './utils';
import {XGEN_DEBUG_LOGS_PROPERTY_NAME} from './utils/constants';
import {pushUserData} from './utils/eventTracking';
import {
  isProduction,
  returnLocalePrefix,
  updateGlblParams,
} from './utils/global';
import {
  getInitialRecommendations,
  getXgenConfig,
  logDebugMessage,
} from './utils/xgen';
import {links as swymLinks} from '~/lib/swym/context/SwymContext';

export type XgenIds = {
  hpBestSellersId?: string;
  trendingId?: string;
};

const seo: SeoHandleFunction<typeof loader> = ({data}) => ({
  title: data?.layout?.seo?.title,
  description: data?.layout?.seo?.description,
});

export const handle = {
  seo,
};

type AnalyticsInitializerProps = {
  hasUserConsent: boolean;
  locale: I18nLocale;
  xgenConfig: XgenConfigType;
  customer?: Customer;
};

function AnalyticsInitializer({
  hasUserConsent,
  locale,
  xgenConfig,
  customer,
}: AnalyticsInitializerProps) {
  useAnalytics(hasUserConsent, locale, xgenConfig, customer);
  return null;
}

export const links: LinksFunction = () => {
  return [
    {
      rel: 'preconnect',
      href: 'https://shop.app',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.gstatic.com',
      crossOrigin: 'anonymous',
    },
    {
      rel: 'preconnect',
      href: 'https://fonts.googleapis.com',
    },
    ...(cssBundleHref ? [{rel: 'stylesheet', href: cssBundleHref}] : []),
    {rel: 'stylesheet', href: stylesheet},
    {
      href: 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,500;0,700;1,500;1,700&display=swap',
      rel: 'stylesheet',
    },
    ...swymLinks(),
  ];
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const isDevEnv = !isProduction(request.url);
  // eslint-disable-next-line no-console
  console.log('isDevEnv', isDevEnv);
  const {cart, ipData, localeData, storefront, env} = context;
  const {
    isIpLocaleConfirmedInCookie,
    localeConfirmationCookieValue,
    pathPrefixLocale,
    ipLocale,
  }: {
    isIpLocaleConfirmedInCookie: boolean;
    localeConfirmationCookieValue: Record<string, string>;
    pathPrefixLocale: I18nLocale;
    ipLocale: I18nLocale;
  } = localeData;

  const OMETRIA_ACCOUNT = isDevEnv
    ? env.OMETRIA_STAGING_ACCOUNT
    : env.OMETRIA_PRODUCTION_ACCOUNT;
  // eslint-disable-next-line no-console
  console.log('OMETRIA_ACCOUNT', OMETRIA_ACCOUNT);

  const xgenConfig = getXgenConfig(context);

  // Fetch initial recommendations for trending products
  const initialRecommendations = await getInitialRecommendations(
    context,
    xgenConfig.trendingId,
  );
  const [shop] = await Promise.all([
    storefront.query<{
      shop: Shop;
      localization: CustomLocalizationType;
    }>(SHOP_QUERY),
  ]);

  const cache = storefront.CacheCustom({
    mode: 'public',
    maxAge: 60,
    staleWhileRevalidate: 60,
  });

  const {data: layout} = await context.sanity.loadQuery(
    LAYOUT_QUERY,
    undefined,
    {
      hydrogen: {
        cache,
      },

      tag: 'layout',
    },
  );

  // Initialize Global-E / Locale Logic handling

  // Get available countries from shop localization
  const {availableCountries} = shop?.localization ?? {availableCountries: []};

  // Set the default locale as a fallback option
  const selectedLocale = getLocaleFromRequestUrl(request.url) || DEFAULT_LOCALE;

  // Initialize a flag to determine if user confirmation is needed for the locale based on whether their approval already exists in a cookie
  const promptLocaleConfirmation = false;

  // Set the locale for the XGen client
  xgenConfig.locale = selectedLocale;

  const customerAccessToken = await context.session.get('customerAccessToken');
  const isAuthenticated = Boolean(customerAccessToken);
  const customer = isAuthenticated
    ? await getCustomer(context, customerAccessToken)
    : undefined;
  const notFoundCollection = layout?.notFoundPage?.collectionGid
    ? storefront.query<{collection: Collection}>(COLLECTION_QUERY_ID, {
        variables: {id: layout.notFoundPage.collectionGid, count: 16},
      })
    : undefined;
  const ENV = {
    APTOS_INVENTORY_LOOKUP_URL: env.APTOS_INVENTORY_LOOKUP_URL,
    APTOS_API_BASEURL: env.APTOS_API_BASEURL,
    APTOS_CLIENT_NAME: env.APTOS_CLIENT_NAME,
    APTOS_API_GUID: env.APTOS_API_GUID,
    APTOS_QTY_THRESHOLD: Number(env.APTOS_QTY_THRESHOLD || 0),
    ECOM_LOCATION_ID: env.ECOM_LOCATION_ID,
  };

  const debugLogs =
    context.xgenDebug?.enabled && context.xgenDebug?.promise
      ? context.xgenDebug.promise.then((logs) => [...logs])
      : null;

  return defer({
    shop: shop.shop,
    analytics: {
      shopifySalesChannel: ShopifySalesChannel.hydrogen,
      shopId: shop.shop.id,
    },
    cart: cart.get(),
    layout,
    notFoundCollection,
    sanityProjectID: env.SANITY_PROJECT_ID,
    sanityDataset: env.SANITY_DATASET,
    selectedLocale,
    storeDomain: storefront.getShopifyDomain(),
    ENV,
    isAuthenticated,
    customer,
    OMETRIA_ACCOUNT,
    availableCountries,
    ipData,
    isIpLocaleConfirmedInCookie,
    localeConfirmationCookieValue,
    promptLocaleConfirmation,
    pathPrefixLocale,
    storefrontApiVersion: env.PUBLIC_STOREFRONT_API_VERSION,
    storefrontApiToken: env.PUBLIC_STOREFRONT_API_TOKEN,
    xgenConfig,
    initialRecommendations,
    xgenDebugLogs: debugLogs,
    preview: context.sanity.preview,
    isPreviewEnabled: context.sanity.preview?.enabled,
  });
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  const {
    preview,
    availableCountries,
    xgenConfig,
    OMETRIA_ACCOUNT,
    ipData,
    pathPrefixLocale,
    isIpLocaleConfirmedInCookie,
    promptLocaleConfirmation,
    selectedLocale,
    initialRecommendations,
    xgenDebugLogs: xgenDebugLogsValue,
    isPreviewEnabled,
    ...data
  } = loaderData;
  const fetcher: Fetcher = useFetcher();
  const [locale, setLocale] = useState(
    selectedLocale ? selectedLocale : DEFAULT_LOCALE,
  );
  const hasUserConsent = true;
  const nonce = useNonce();
  const availableLocales: Locales = createLocales(availableCountries);
  const [isGorgiasLoaded, setIsGorgiasLoaded] = useState(false);
  const [resolvedXgenDebugLogs, setResolvedXgenDebugLogs] = useState<
    string[] | null
  >(null);
  const loggedMessagesRef = useRef<Set<string>>(new Set());

  const {
    isAuthenticated,
    customer,
    storeDomain,
    localeConfirmationCookieValue,
  } = data;
  const location = useLocation();
  const currentUrl = location.pathname + location.search;
  const navigate: NavigateFunction = useNavigate();

  useEffect(() => {
    let isCancelled = false;

    if (!xgenDebugLogsValue) {
      setResolvedXgenDebugLogs(null);
      return;
    }

    Promise.resolve(xgenDebugLogsValue).then((logs) => {
      if (isCancelled) return;
      setResolvedXgenDebugLogs(logs);
    });

    return () => {
      isCancelled = true;
    };
  }, [xgenDebugLogsValue]);

  // Set the XGen debug logs in the window object
  useEffect(() => {
    if (resolvedXgenDebugLogs && resolvedXgenDebugLogs.length > 0) {
      const existing = Array.isArray(window[XGEN_DEBUG_LOGS_PROPERTY_NAME])
        ? window[XGEN_DEBUG_LOGS_PROPERTY_NAME].filter(
            (entry) => !resolvedXgenDebugLogs.includes(entry),
          )
        : [];
      window[XGEN_DEBUG_LOGS_PROPERTY_NAME] = [
        ...resolvedXgenDebugLogs,
        ...existing,
      ];

      resolvedXgenDebugLogs.forEach((entry) => {
        if (loggedMessagesRef.current.has(entry)) return;
        loggedMessagesRef.current.add(entry);
        logDebugMessage(entry, 'SERVER');
      });
    } else if (XGEN_DEBUG_LOGS_PROPERTY_NAME in window) {
      delete window[XGEN_DEBUG_LOGS_PROPERTY_NAME];
      loggedMessagesRef.current.clear();
    }
  }, [resolvedXgenDebugLogs]);

  const setLocaleAndUpdate = useCallback(
    (newLocale: I18nLocale) => {
      postLocaleCookie(locale, newLocale);
      const baseDomain = window.location.origin;
      const newSelectedLocale = locale ? locale : DEFAULT_LOCALE;
      updateGlblParams(newLocale.country, newLocale.currency, storeDomain);
      setLocale(newLocale);
      localePrefixUpdate(
        currentUrl,
        fetcher,
        newLocale,
        newSelectedLocale,
        navigate,
        baseDomain,
      );
      // set local storage for most recently chosen locale
      storeLocaleInLocalStorage(newLocale);
      updateFreeShippingBanner(newLocale);
      // updateBuyerIdentity(data.cart, newLocale.country);
      updateBuyerIdentity(newLocale.country);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, currentUrl, fetcher, navigate],
  );

  // Event Tracking Data
  const eventTrackingData = useMemo(
    () => ({
      cart: data.cart?._data,
      customer,
      currency: selectedLocale.currency,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, customer],
  );
  /*
  // Elevar
  useEffect(() => {
    // on virtual page change, Elevar requests this:
    window.ElevarInvalidateContext?.();
    pushUserData(
      eventTrackingData.cart,
      eventTrackingData.customer,
      eventTrackingData.currency,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Peak Activity
  useEffect(() => {
    const routePath = location.pathname;
    const queryParams = location.search;
    // on virtual page change, Elevar requests this:
    window.ElevarInvalidateContext?.();
    pushUserDataNew(
      routePath,
      eventTrackingData.cart,
      eventTrackingData.customer,
      eventTrackingData.currency,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, customer]);
*/
  //PEAK ACTIVITY ADDITIONS STARTS
  useEffect(() => {
    const routePath = location.pathname;
    const queryParams = location.search;

    //console.log("Route Path:", routePath);
    //console.log("Query Params:", queryParams);
    window.ElevarInvalidateContext?.();
    pushPageLoadedEvent(
      routePath,
      eventTrackingData.customer,
      'Staging',
      eventTrackingData.cart,
      eventTrackingData.currency,
    );
  }, [location.pathname, location.search, customer, eventTrackingData]);
  // PEAK
  useEffect(() => {
    //console.log("Calling handleGtmClick from root.tsx"); // Debugging log
    handleGtmClick();
  }, []);
  //PEAK ACTIVITY ADDITIONS ENDS

  // Update the GLBE_PARAMS object with the current locale when it exists
  useUpdateGlobalEParams(locale, storeDomain);

  const globalContextValues = useMemo(() => {
    const updateLocale = async (newLocale: I18nLocale) => {
      const isLocaleConfirmed =
        localeConfirmationCookieValue &&
        newLocale.country in localeConfirmationCookieValue;
      const isDefaultLocale = newLocale.country.toLowerCase() === 'us';
      const shouldUpdateLocale =
        isLocaleConfirmed ||
        isDefaultLocale ||
        window.confirm(
          `Would you like to view prices local to ${newLocale.label}?`,
        );
      if (shouldUpdateLocale) {
        setLocaleAndUpdate(newLocale);
      }
    };
    return {
      isAuthenticated,
      customer,
      locale,
      setLocale: updateLocale,
      availableLocales,
      ipData,
      isIpLocaleConfirmedInCookie,
      eventTrackingData,
      storeDomain,
      OMETRIA_ACCOUNT,
      xgenConfig,
    };
  }, [
    availableLocales,
    localeConfirmationCookieValue,
    customer,
    ipData,
    isAuthenticated,
    isIpLocaleConfirmedInCookie,
    locale,
    setLocaleAndUpdate,
    eventTrackingData,
    storeDomain,
    OMETRIA_ACCOUNT,
    xgenConfig,
  ]);

  // JME-351 Global-E confirmation prompt
  useGlobalEUpdateOrCookiePost(
    locale,
    pathPrefixLocale,
    promptLocaleConfirmation,
    setLocaleAndUpdate,
  );

  useEffect(() => {
    if (customer) {
      window.cnstrcUserId = stripGlobalId(customer.id);
    }
  }, [customer]);

  useEffect(() => {
    const currentCartAttributes = data.cart?._data?.attributes || [];
    if (isGorgiasLoaded && currentCartAttributes.length > 0) {
      const fetchGorgiasCartAttributes = async () => {
        const cartAttributes = window.GorgiasBridge.createCartAttributes();
        const currentCartAttributes = data.cart._data.attributes;

        let hasGuestId = false;
        let hasSessionId = false;

        for (const attribute of currentCartAttributes) {
          if (attribute.key === 'gorgias.guestId') {
            hasGuestId = true;
          } else if (attribute.key === 'gorgias.sessionId') {
            hasSessionId = true;
          }
        }
        // if gorgias attributes have NOT already been added to the cart, add them
        if (!hasGuestId || !hasSessionId) {
          try {
            await fetcher.submit(
              {
                cartFormInput: JSON.stringify({
                  action: CartForm.ACTIONS.AttributesUpdateInput,
                  inputs: {
                    gorgiasInfo: {
                      'gorgias.guestId': cartAttributes[0].value,
                      'gorgias.sessionId': cartAttributes[1].value,
                    },
                  },
                }),
              },
              {method: 'post', action: '/cart?index'},
            );
            // set the variable back to false so we only set this info once
            setIsGorgiasLoaded(false);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log('Error setting gorgias cart attributes:', error);
          }
        }
      };
      fetchGorgiasCartAttributes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGorgiasLoaded, data.cart]);

  // Custom Scripts
  useCustomLoadScript('https://cdn.userway.org/widget.js', {
    in: 'head',
    async: true,
    dataset: {
      account: 'QwMF1aPmQ4',
      trigger: 'accessibilityMenu',
    },
  });

  // Size Chart - JME622
  useCustomLoadScript(
    undefined,
    {
      content: JME622SizeChart,
      in: 'body',
    },
    'inline-size-chart',
  );

  useCustomLoadScript(
    `https://apps.bazaarvoice.com/deployments/jmclaughlin/main_site/${
      storeDomain.includes('dev') ? 'staging' : 'production'
    }/en_US/bv.js`,
    {
      async: true,
      in: 'head',
    },
  );

  useCustomLoadScript(
    '//edge.curalate.com/sites/jmclaughlin-md7w8i/site/latest/site.min.js',
    {
      async: true,
      in: 'head',
      onLoadCallback: () => initBazaarVoice(),
    },
  );

  // Omniconvert Init
  useCustomLoadScript('//cdn.omniconvert.com/js/v997799.js', {
    async: false,
    in: 'head',
    onLoadCallback: () => {
      window._mktz = window._mktz || [];
    },
  });

  // Referal Candy init
  useCustomLoadScript(
    '//portal.referralcandy.com/assets/widgets/refcandy-candyjar.js',
    {
      async: true,
      in: 'head',
      onLoadCallback: () => initReferralCandy(),
    },
  );

  useCustomLoadScript(
    `https://config.gorgias.chat/bundle-loader/${
      storeDomain.includes('dev')
        ? '01HDS4P5ZQX37A869XK17V6ABC'
        : '01GYCCFP3DVX3P57HJ4HYYMER7'
    }`,
    {
      in: 'body',
      async: true,
      onLoadCallback: () => {
        const initGorgiasBridgePromise = window.GorgiasBridge
          ? window.GorgiasBridge.init()
          : new Promise(function (resolve, reject) {
              const timer = setTimeout(
                () => reject(new Error('Gorgias bridge loading timed out')),
                15000,
              );
              window.addEventListener('gorgias-bridge-loaded', function () {
                clearTimeout(timer);
                resolve();
              });
            });

        initGorgiasBridgePromise
          .then(async () => {
            // attributes attachment will happen here
            setIsGorgiasLoaded(true);
          })
          .catch((error) => {
            // eslint-disable-next-line no-console
            console.log('Failed to load Gorgias bridge:', error);
          });
      },
    },
  );

  // Load Gorgias Custom Campaign Bundler
  useCustomLoadScript(
    `https://bundle.dyn-rev.app/loader.js?g_cvt_id=c3c075ae-2723-44bd-90e8-2a9d9c25b286`,
    {
      in: 'body',
      id: 'convert-bundle-loader',
      async: true,
    },
  );

  //web-crawler
  useCustomLoadScript(`https://static.srcspot.com/libs/tallia.js`, {
    in: 'head',
    async: true,
  });

  // Load Impact.com script
  useCustomLoadScript(
    'https://utt.impactcdn.com/A4982275-d99c-4cd1-8d71-9b318c9439271.js',
    {
      in: 'head',
      async: true,
      onLoadCallback: async () => {
        if (!window.ire) return;

        window.ire('identify', {
          customerId: customer?.id ? stripGlobalId(customer.id) : '',
          customerEmail: customer?.email ? await sha1(customer.email) : '',
        });
      },
    },
  );

  // Elevar
  useCustomLoadScript(
    '',
    {
      module: true,
      in: 'head',
      content: `
      try {
        const response = await fetch("https://shopify-gtm-suite.getelevar.com/configs/b853abb0244101453e006ab62be24cc4bf138d3a/config.json");
        const config = await response.json();
        const scriptUrl = config.script_src_custom_pages;

        if (scriptUrl) {
          const { handler } = await import(scriptUrl);
          await handler(config);
        }
      } catch (error) {
        console.error("Elevar Error:", error);
      }
    `,
    },
    'inline-elevar',
  );

  // GTM
  /*
  useCustomLoadScript(
    'https://www.googletagmanager.com/gtm.js?id=GTM-T7JT83SJ',
    {
      async: true,
      in: 'head',
      onLoadCallback: () => {
        // Elevar forwards to native dataLayer
        window.ElevarDataLayer = window.ElevarDataLayer ?? [];
        window.ElevarDataLayer.push({
          'gtm.start': new Date().getTime(),
          event: 'gtm.js',
        });
      },
    },
  );
*/
  //PEAK ACTIVITY ADDITIONS STARTS
  useEffect(() => {
    const storeDomain = window.location.hostname;

    if (storeDomain.includes('.dev') || storeDomain.includes('localhost')) {
      // Staging GTM Install Script
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
        const f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l !== 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src =
          'https://sst.jmclaughlin.com/gtm.js?id=' +
          i +
          dl +
          '&gtm_auth=jbHQllOkugIbXn7uQ6HoHQ&gtm_preview=env-1063&gtm_cookies_win=x';
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', 'GTM-T7JT83SJ');
      // eslint-disable-next-line no-console
      console.log('Staging GTM script loaded.');
    } else {
      // Production GTM Install Script
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
        const f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l !== 'dataLayer' ? '&l=' + l : '';
        j.async = true;
        j.src =
          'https://sst.jmclaughlin.com/gtm.js?id=' +
          i +
          dl +
          '&gtm_auth=K7hCbyHMUa4uLGtu24Rg3g&gtm_preview=env-1&gtm_cookies_win=x';
        f.parentNode.insertBefore(j, f);
      })(window, document, 'script', 'dataLayer', 'GTM-T7JT83SJ');
      // eslint-disable-next-line no-console
      console.log('Production GTM script loaded.');
    }
  }, []);

  //PEAK ACTIVITY ADDITIONS ENDS

  useCustomLoadScript(
    'https://cookie-cdn.cookiepro.com/scripttemplates/otSDKStub.js',
    {
      in: 'head',
      async: true,
      dataset: {
        domainScript: `${
          storeDomain.includes('dev')
            ? '6860826d-b511-4432-a623-e4c1bf276c29-test'
            : '6860826d-b511-4432-a623-e4c1bf276c29'
        }`,
      },
      onLoadCallback: () => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({event: 'OneTrustGroupsUpdated'});
      },
    },
  );

  useCustomLoadScript(`https://cdn.ometria.com/tags/${OMETRIA_ACCOUNT}.js`, {
    in: 'head',
    async: true,
  });

  useVideowise(data.storeDomain.replace('https://', ''));

  // add shoppable products to cart from Videowise content
  useEffect(() => {
    function handleAddToCart(event: CustomEvent) {
      const formData = new FormData();
      const {variantId, qty} = event.detail || {};
      if (!variantId || !qty) return;
      formData.append('variantId', variantId);
      formData.append('quantity', qty.toString());

      // Submit to your cart action
      fetcher.submit(formData, {
        method: 'post',
        action: `${locale.pathPrefix}/api/cart/videowiseAdd`,
      });

      // After submit, close the video player and open the cart flyout
      document.getElementById('cartIcon')?.click();
      //eslint-disable-next-line no-console
      console.log(
        'Added to cart via Videowise:',
        'variantId:',
        variantId,
        'quantity',
        qty,
      );
    }

    window.addEventListener('videowiseProductAddToCart', handleAddToCart);

    return () => {
      window.removeEventListener('videowiseProductAddToCart', handleAddToCart);
    };
  }, [fetcher, locale.pathPrefix]);

  const revalidator = useRevalidator();
  const [revalidatorPromise, setRevalidatorPromise] = useState<
    (() => void) | null
  >(null);
  const [revalidatorLoading, setRevalidatorLoading] = useState(false);

  useEffect(() => {
    if (revalidatorPromise && revalidator.state === 'loading') {
      setRevalidatorLoading(true);
    } else if (
      revalidatorPromise &&
      revalidatorLoading &&
      revalidator.state === 'idle'
    ) {
      revalidatorPromise();
      setRevalidatorPromise(null);
      setRevalidatorLoading(false);
    }
  }, [revalidatorLoading, revalidator.state, revalidatorPromise]);

  const handleRefresh = useCallback(
    (payload: any, refreshDefault: any) => {
      if (payload.source === 'mutation' && payload.livePreviewEnabled) {
        return new Promise<void>((resolve) => {
          revalidator.revalidate();
          setRevalidatorPromise(() => resolve);
        });
      }
      return refreshDefault();
    },
    [revalidator],
  );

  const locationPath = location.pathname;
  const plpCheck = locationPath.includes('/collections/');

  return (
    <html lang={locale.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta property="og:type" content="website" />
        {!location.pathname.includes('/products') && (
          <meta
            property="og:image"
            content="https://cdn.sanity.io/images/tzehqw2l/production/b8e2b5250156d3fa555e052b10533d5a7bdf3a15-1200x630.png"
          />
        )}
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="twitter:domain" content="https://www.jmclaughlin.com" />
        <meta
          property="twitter:url"
          content={`https://www.jmclaughlin.com${location.pathname}`}
        />
        <meta name="twitter:site" content="@JMcLaughlinNY" />
        <meta property="og:site_name" content="JMcLaughlin" />
        {!plpCheck && <SchemaTag schema={HOME_BREADCRUMB} />}
        <Seo />
        <GlobalSchemas />
        <Meta />
        <Links />
        <SeoIndexingTags locale={locale} availableLocales={availableLocales} />
      </head>
      <body>
        <ShopifyProvider
          storeDomain={storeDomain}
          storefrontToken={data.storefrontApiToken}
          storefrontApiVersion="2024-10"
          countryIsoCode={locale.country}
          languageIsoCode="EN"
        >
          {/* Preload initial recommendation images */}
          {/*{initialRecommendations?.map((item) => (*/}
          {/*  <link*/}
          {/*    rel="preload"*/}
          {/*    as="image"*/}
          {/*    href={`${item.image}&width=700&height=935&crop=center`}*/}
          {/*    key={item.prod_code}*/}
          {/*  />*/}
          {/*))}*/}
          <GlobalContext.Provider value={globalContextValues}>
            <SwymProvider>
              <XgenClientProvider config={xgenConfig}>
                <AnalyticsInitializer
                  hasUserConsent={hasUserConsent}
                  locale={locale}
                  xgenConfig={xgenConfig}
                  customer={customer}
                />
                <Layout
                  key={`${returnLocalePrefix(locale)}`}
                  isPreviewEnabled={isPreviewEnabled}
                  // NOTE: passing layout through params to have value without
                  // CSR hydration
                  layout={data.layout}
                >
                  <Outlet />
                </Layout>
              </XgenClientProvider>
              {isPreviewEnabled && <VisualEditing action="/api/preview" />}
              <ScrollRestoration nonce={nonce} />
              <Scripts nonce={nonce} />
              <LiveReload />
            </SwymProvider>
          </GlobalContext.Provider>
        </ShopifyProvider>
      </body>
    </html>
  );
}

export function ErrorBoundary({error}: {error: Error}) {
  useCustomLoadScript('https://cdn.userway.org/widget.js', {
    in: 'head',
    async: true,
    dataset: {
      account: 'QwMF1aPmQ4',
      trigger: 'accessibilityMenu',
    },
  });

  useCustomLoadScript(
    '//edge.curalate.com/sites/jmclaughlin-md7w8i/site/latest/site.min.js',
    {
      async: true,
      in: 'head',
      onLoadCallback: () => initBazaarVoice(),
    },
  );

  // Load Impact.com script
  useCustomLoadScript(
    'https://utt.impactcdn.com/A4982275-d99c-4cd1-8d71-9b318c9439271.js',
    {
      in: 'head',
      async: true,
    },
  );

  const [root] = useMatches();
  const nonce = useNonce();

  const routeError = useRouteError();
  const isRouteError = isRouteErrorResponse(routeError);

  const availableLocales = root.data?.selectedLocale;

  const preview = {};
  const {
    availableCountries,
    ipData,
    layout,
    notFoundCollection,
    customer,
    xgenConfig,
  } = root.data ? root.data : {layout: null, notFoundCollection: {}};
  const {notFoundPage} = layout || {};

  const location = useLocation();
  const navigate = useNavigate();
  const fetcher: Fetcher = useFetcher();
  const [locale, setLocale] = useState(
    root.data?.selectedLocale ?? DEFAULT_LOCALE,
  );
  const currentUrl = location.pathname + location.search;
  const isAuthenticated = root.data?.isAuthenticated;
  const isServerLocaleConfirmedInCookie =
    root.data?.isServerLocaleConfirmedInCookie;
  const storeDomain = root.data?.storeDomain;

  const setLocaleAndUpdate = useCallback(
    (newLocale: I18nLocale) => {
      // Trigger a fetch request to a Remix action
      fetch('/api/update-locale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({locale: newLocale.country}),
      });
      const baseDomain = window.location.origin;
      const selectedLocale = locale ?? DEFAULT_LOCALE;
      setLocale(newLocale);
      localePrefixUpdate(
        currentUrl,
        fetcher,
        newLocale,
        selectedLocale,
        navigate,
        baseDomain,
        ipData,
      );
    },
    [currentUrl, fetcher, ipData, locale, navigate],
  );

  const eventTrackingData = useMemo(
    () => ({
      cart: root.data?.cart?._data,
      customer,
      currency: root.data?.selectedLocale?.currency,
    }),
    [root.data, customer],
  );

  const globalContextValues = useMemo(() => {
    return {
      isAuthenticated,
      customer,
      locale,
      availableLocales,
      ipData,
      isServerLocaleConfirmedInCookie,
      eventTrackingData,
      storeDomain,
    };
  }, [
    availableLocales,
    customer,
    ipData,
    isAuthenticated,
    isServerLocaleConfirmedInCookie,
    locale,
    eventTrackingData,
    storeDomain,
  ]);

  let title = 'Error';
  if (isRouteError) {
    title = 'Not found';
  }

  return (
    <html lang={locale.language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta
          name="facebook-domain-verification"
          content="etovds6jqztmn3d6zu0196v2e4h35g"
        />
        <title>{title}</title>
        <Meta />
        <Links />
      </head>
      <body>
        <GlobalContext.Provider value={globalContextValues}>
          <XgenClientProvider config={xgenConfig}>
            <SwymProvider>
              <Layout
                key={`${returnLocalePrefix(locale)}`}
                backgroundColor={notFoundPage?.colorTheme?.background}
              >
                {isRouteError ? (
                  <>
                    {routeError.status === 404 ? (
                      <NotFound
                        notFoundPage={notFoundPage}
                        notFoundCollection={notFoundCollection}
                      />
                    ) : (
                      <GenericError
                        error={{
                          message: `${routeError.status} ${routeError.data}`,
                        }}
                      />
                    )}
                  </>
                ) : (
                  <GenericError
                    error={error instanceof Error ? error : undefined}
                  />
                )}
              </Layout>
            </SwymProvider>
          </XgenClientProvider>
        </GlobalContext.Provider>
        <Scripts nonce={nonce} />
        <LiveReload />
      </body>
    </html>
  );
}
