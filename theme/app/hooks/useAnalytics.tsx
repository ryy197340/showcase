import {useFetchers, useLocation} from '@remix-run/react';
import {
  AnalyticsEventName,
  CartForm,
  getClientBrowserParameters,
  sendShopifyAnalytics,
  type ShopifyAddToCartPayload,
  type ShopifyPageViewPayload,
  useShopifyCookies,
} from '@shopify/hydrogen';
import {Customer} from '@shopify/hydrogen/storefront-api-types';
import {useEffect, useRef} from 'react';

import {useXgenClientWhenReady} from '~/contexts/XgenClientContext';
import {XgenConfigType} from '~/lib/xgen/types';
import {I18nLocale} from '~/types/shopify';
import {pushAddToCartXgen, pushPageViewXgen} from '~/utils/eventTracking';
import {pushAddToCartNew} from '~/utils/gtmEvents'; //PEAK ACTIVITY ADDITIONS STARTS

import useDataFromMatches from './useDataFromMatches';

export function useAnalytics(
  hasUserConsent: boolean,
  locale: I18nLocale,
  xgenConfig: XgenConfigType,
  customer?: Customer,
) {
  const addToCartDataRef = useRef<null | ShopifyAddToCartPayload>(null);
  const {client: xgenClient, isReady: isXgenReady} = useXgenClientWhenReady();

  useShopifyCookies({hasUserConsent});
  const location = useLocation();
  const analyticsFromMatches = useDataFromMatches(
    'analytics',
  ) as unknown as ShopifyPageViewPayload;

  const pageAnalytics = {
    ...analyticsFromMatches,
    currency: locale.currency,
    acceptedLanguage: locale.language,
    hasUserConsent,
  };

  // Page view analytics
  // We want useEffect to execute only when location changes
  // which represents a page view
  const lastLocationKey = useRef('');
  useEffect(() => {
    // Only continue if the user's location changed.
    if (lastLocationKey.current === location.key) return;
    lastLocationKey.current = location.key;
    const payload: ShopifyPageViewPayload = {
      ...getClientBrowserParameters(),
      ...pageAnalytics,
    };

    sendShopifyAnalytics({
      eventName: AnalyticsEventName.PAGE_VIEW,
      payload,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  useEffect(() => {
    if (isXgenReady) {
      pushPageViewXgen(xgenClient);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isXgenReady]);

  const addToCartData = useDataFromFetchers({
    cartAction: CartForm.ACTIONS.LinesAdd,
    dataKey: 'analytics',
  }) as unknown as ShopifyAddToCartPayload;

  // Trigger itemAddedToCart event whenever there's add to cart data, regardless of quantity condition
  if (addToCartData && addToCartData.products && addToCartData.products[0]) {
    const product = addToCartData.products[0];
    window.dispatchEvent(
      new CustomEvent('itemAddedToCart', {
        detail: {product},
      }),
    );
  }

  if (
    addToCartData &&
    (addToCartDataRef.current === null ||
      addToCartData.cart?.totalQuantity !==
        addToCartDataRef.current?.cart?.totalQuantity)
  ) {
    // addToCartDataRef.current === null
    // (If the cache is clear and a cart hasn't been created yet, there won't be a cart reference. We should move forward and track the add to cart though, to get the ball rolling.)

    // addToCartData.cart?.totalQuantity !== addToCartDataRef.current?.cart?.totalQuantity
    // (We were getting duplicate submissions due to a re-render, so now we only track the add to cart if there has been an update.)

    // Store current cart for future comparison. Use a ref to avoid causing a render.
    addToCartDataRef.current = addToCartData;

    //PEAK to send the qty to the event
    //console.log("addToCartData", addToCartData);

    // Extract the product line using the variantGid
    const productLine = addToCartData.cart?.lines.edges.find(
      (line) =>
        line.node.merchandise.id === addToCartData.products[0].variantGid,
    );

    /*
** Peak  code below replaces the code below since the qty was always 1 even when more than one of the item is being added to the cart
    const addToCartPayload: ShopifyAddToCartPayload = {
      ...getClientBrowserParameters(),
      ...pageAnalytics,
      ...addToCartData,
    };
*/
    // Build the addToCartPayload
    const addToCartPayload: ShopifyAddToCartPayload = {
      ...getClientBrowserParameters(),
      ...pageAnalytics,
      ...addToCartData,
      products: [
        {
          ...addToCartData.products[0],
          quantity: productLine
            ? productLine.node.quantity
            : addToCartData.products[0].quantity,
        },
      ],
    };

    sendShopifyAnalytics({
      eventName: AnalyticsEventName.ADD_TO_CART,
      payload: addToCartPayload,
    });
    if (addToCartPayload.products && xgenClient) {
      pushAddToCartXgen(
        xgenClient,
        addToCartPayload.products[0],
        customer,
        locale.currency,
      );
      pushAddToCartNew(
        addToCartPayload.products[0],
        addToCartPayload.products[0].quantity,
        customer,
        locale.currency,
      );
      //PEAK ACTIVITY ADDITIONS ENDS
    }
  }

  const updateCartData = useDataFromFetchers({
    cartAction: CartForm.ACTIONS.LinesUpdate,
    dataKey: 'analytics',
  }) as unknown as ShopifyAddToCartPayload;
  if (updateCartData) {
    const updateCartPayload: ShopifyAddToCartPayload = {
      ...getClientBrowserParameters(),
      ...pageAnalytics,
      ...updateCartData,
    };
  }

  const removeCartData = useDataFromFetchers({
    cartAction: CartForm.ACTIONS.LinesRemove,
    dataKey: 'analytics',
  }) as unknown as ShopifyAddToCartPayload;
  if (removeCartData) {
    const removeCartPayload: ShopifyAddToCartPayload = {
      ...getClientBrowserParameters(),
      ...pageAnalytics,
      ...removeCartData,
    };
  }
}

/**
 * Collects data under a certain key from useFetches.
 *
 * @param formDataKey - The form data key
 * @param formDataValue - The value of formDataKey
 * @param dataKey - the key in `fetcher.data` to collect data from
 * @returns A merged object of the specified key
 *
 * @example
 * ```tsx
 * // In routes/cart.tsx
 * import {
 *   useDataFromFetchers
 * } from '@shopify/hydrogen';
 *
 * export async function action({request, context}: ActionFunctionArgs) {
 *   const cartId = await session.get('cartId');
 *   ...
 *   return json({
 *     analytics: {
 *       cartId,
 *     },
 *   });
 * }
 *
 * // Anywhere when an action can be requested, make sure there is a form input and value
 * // to identify the fetcher
 * export function AddToCartButton({
 *   ...
 *   return (
 *     <fetcher.Form action="/cart" method="post">
 *       <input type="hidden" name="cartAction" value={CartForm.ACTIONS.LinesAdd} />
 *
 * // You can add additional data as hidden form inputs and it will also be collected
 * // As long as it is JSON parse-able.
 * export function AddToCartButton({
 *
 *   const analytics = {
 *     products: [product]
 *   };
 *
 *   return (
 *     <fetcher.Form action="/cart" method="post">
 *       <input type="hidden" name="cartAction" value={CartForm.ACTIONS.LinesAdd} />
 *       <input type="hidden" name="analytics" value={JSON.stringify(analytics)} />
 *
 * // In root.tsx
 * export default function App() {
 *   const cartData = useDataFromFetchers({
 *     cartAction: CartForm.ACTIONS.LinesAdd,
 *     dataKey: 'analytics',
 *   });
 *
 *   console.log(cartData);
 *   // {
 *   //   cartId: 'gid://shopify/Cart/abc123',
 *   //   products: [...]
 *   // }
 * ```
 **/
function useDataFromFetchers({
  cartAction,
  dataKey,
}: {
  cartAction: string;
  dataKey: string;
}): Record<string, unknown> | undefined {
  const fetchers = useFetchers();
  const data: Record<string, unknown> = {};
  for (const fetcher of fetchers) {
    const formData = fetcher?.formData;
    const fetcherData = fetcher.data;
    const formInputs = formData ? CartForm.getFormInput(formData) : null;

    if (
      formData &&
      formInputs &&
      formInputs.action === cartAction &&
      fetcherData &&
      fetcherData[dataKey]
    ) {
      Object.assign(data, fetcherData[dataKey]);

      try {
        if (formData.get(dataKey)) {
          const dataInForm: unknown = JSON.parse(String(formData.get(dataKey)));
          Object.assign(data, dataInForm);
        }
      } catch {
        // do nothing
      }
    }
  }
  return Object.keys(data).length ? data : undefined;
}
