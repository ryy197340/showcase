import {ShopifyAnalyticsProduct} from '@shopify/hydrogen';
import {Customer} from '@shopify/hydrogen/storefront-api-types';
import XGenClient, {SearchProduct} from '@xgenai/sdk-core';

import {CioCollectionStructure, CioResult} from '~/lib/constructor/types';
import {ProductRouteProduct} from '~/types/shopify';

import {sha1, sha256, stripGlobalId} from '.';

const getElevarProductsFromCart = (cart) => {
  if (!cart) return [];

  /** Products Array **/
  return cart.lines.edges.map((edge, index) => {
    const line = edge.node;
    return {
      id: line.merchandise.sku,
      name: line.merchandise.product.title,
      brand: 'J. McLaughlin',
      category: '',
      variant: line.merchandise.title,
      price: line.merchandise.price.amount,
      quantity: line.quantity.toString(),
      position: index + 1,
      list: '', // The list the product was discovered from
      product_id: stripGlobalId(line.merchandise.product.id),
      variant_id: stripGlobalId(line.merchandise.id),
      compare_at_price: line.merchandise.compareAtPrice?.amount || '0.0',
      image: line.merchandise?.image?.url || '',
      url: `/products/${line.merchandise.product.handle}`,
    };
  });
};

const getElevarProduct = (product, index?: number) => {
  return [
    {
      id: product?.selectedVariant?.sku || '',
      name: product.title,
      brand: product.vendor ?? 'J. McLaughlin',
      category: '',
      variant: product?.selectedVariant?.title || '',
      price: product?.selectedVariant?.price.amount || '',
      position: typeof index === 'number' ? index + 1 : null, // Only required for dl_select_item; position in the list of search results, collection views and position in cart indexed starting at 1
      list: '', // The list the product was discovered from
      product_id: product?.id ? stripGlobalId(product.id) : '',
      variant_id: product?.selectedVariant?.id
        ? stripGlobalId(product.selectedVariant.id)
        : '',
      compare_at_price:
        product?.selectedVariant?.compareAtPrice?.amount || '0.0',
      image: product?.media?.nodes[0]?.image?.url || '',
      url: `/products/${product.handle}`,
    },
  ];
};

const getCartActionProduct = (lineItem, quantityOverride) => {
  const quantity = quantityOverride || lineItem.quantity;
  const elevarData = [
    {
      id: lineItem.merchandise.sku,
      name: lineItem.merchandise.product.title,
      brand: 'J. McLaughlin',
      category: '',
      variant: lineItem.merchandise.title,
      price: lineItem.merchandise.price.amount,
      quantity: quantity.toString(),
      // position: item.position, // Only required for dl_select_item; position in the list of search results, collection views and position in cart indexed starting at 1
      list: '', // The list the product was discovered from
      product_id: stripGlobalId(lineItem.merchandise.product.id),
      variant_id: stripGlobalId(lineItem.merchandise.id),
      compare_at_price: lineItem.merchandise?.compareAtPrice?.amount || '0.0',
      image: lineItem.merchandise.image.url,
      url: `/products/${lineItem.merchandise.product.handle}`,
    },
  ];

  const wPromoteData = [
    {
      item_id: lineItem.merchandise.sku,
      item_name: lineItem.merchandise.product.title,
      discount: lineItem.merchandise?.compareAtPrice?.amount
        ? parseFloat(lineItem.merchandise.compareAtPrice.amount) -
          parseFloat(lineItem.merchandise.price.amount)
        : 0,
      item_brand: 'J. McLaughlin',
      item_category: '',
      item_category2: '',
      item_category3: '',
      item_variant: lineItem.merchandise.title,
      price: lineItem.merchandise?.compareAtPrice?.amount
        ? parseFloat(lineItem.merchandise.compareAtPrice.amount)
        : parseFloat(lineItem.merchandise.price.amount),
      quantity,
    },
  ];

  return [elevarData, wPromoteData];
};

/** User Properties Object **/
// The majority of this information can only be retrieved for a logged in user
const getUserProperties = (customer) => {
  const userProperties: {
    user_consent: string;
    visitor_type: string;
    customer_address_1?: string | null;
    customer_address_2?: string | null;
    customer_city?: string | null;
    customer_country?: string | null;
    customer_email?: string | null;
    customer_first_name?: string | null;
    customer_id?: string | null;
    customer_last_name?: string | null;
    customer_order_count?: string | null;
    customer_phone?: string | null;
    customer_province?: string | null;
    customer_tags?: string | null;
    customer_total_spent?: string | null;
    customer_zip?: string | null;
  } = {
    user_consent: '', // Use an empty string
    visitor_type: 'guest', // "logged_in" || "guest"
  };

  if (customer) {
    // The following fields aren't required if unavailable
    userProperties.customer_address_1 = customer.defaultAddress?.address1 || '';
    userProperties.customer_address_2 = customer.defaultAddress?.address2 || '';
    userProperties.customer_city = customer.defaultAddress?.city || '';
    userProperties.customer_country = customer.defaultAddress?.country || '';
    userProperties.customer_email = customer.email || '';
    userProperties.customer_first_name = customer.firstName || '';
    userProperties.customer_id = customer?.id ? stripGlobalId(customer.id) : '';
    userProperties.customer_last_name = customer.lastName || '';
    userProperties.customer_order_count =
      customer.orders?.edges?.length.toString() || '';
    userProperties.customer_phone = customer.phone || '';
    userProperties.customer_province = customer.defaultAddress?.province || '';
    userProperties.customer_tags = '';
    userProperties.customer_total_spent = customer.orders.edges
      .reduce(
        (acc, order) => acc + parseFloat(order.node.currentTotalPrice.amount),
        0,
      )
      .toString();
    userProperties.customer_zip = customer.defaultAddress?.zip || '';

    // The following fields are required
    userProperties.user_consent = ''; // Use an empty string
    userProperties.visitor_type = 'logged_in'; // "logged_in" || "guest"
  }

  return userProperties;
};

/** Impressions Array **/
// The impressions array must be less than 4000 characters.
// The most logical way to limit this is by the number of products you send
const getImpressions = (items) => {
  if (!items) return [];

  return items.slice(0, 10).map((item, index) => {
    return {
      id: item?.data?.SKU?.[0] || item?.data?.id,
      name: item?.value,
      brand: 'J. McLaughlin',
      category: '',
      variant: item.data?.color,
      price: item.data?.price?.toString(),
      list: location.pathname,
      product_id: item.data?.shopify_id?.toString(),
      variant_id: item.data?.variant_ids?.[0],
      compare_at_price:
        (item.data?.variant_compare_at_prices?.[0] &&
          parseFloat(item.data?.variant_compare_at_prices?.[0])) ||
        0,
      position: index + 1,
    };
  });
};

const getCartTotal = (cart) => {
  let cartTotal = '0';

  if (cart?.lines?.edges) {
    cartTotal = cart.cost.subtotalAmount.amount;
  }

  return cartTotal;
};

/** Elevar Base Data Layer **/
// Should be fired before all other events and on virtual page change
export const pushUserData = async (cart, customer, currencyCode = 'USD') => {
  /*
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_user_data',
    cart_total: getCartTotal(cart),
    user_properties: getUserProperties(customer),
    ecommerce: {
      currencyCode,
      cart_contents: {
        products: getElevarProductsFromCart(cart),
      },
    },
  });

  // WPromote
  window.ElevarDataLayer.push({
    event: 'page_view',
    user_data: {
      hashed_email: customer?.email ? await sha256(customer.email) : '',
      hashed_phone: customer?.phone ? await sha256(customer.phone) : '',
    },
  });

  // Impact
  if (!window.ire) {
    return;
  }

  window.ire('identify', {
    customerId: customer?.id ? stripGlobalId(customer.id) : '',
    customerEmail: customer?.email ? await sha1(customer.email) : '',
  });

  */
};

/** Customer creates new account **/
// If your users don’t typically sign up this event is not required
export const pushSignUpData = (customer) => {
  /**
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_sign_up',
    user_properties: getUserProperties(customer),
  });
  */
};

/** Customer Logs into their account **/ // If your users don’t typically login this event is not required
export const pushLoginData = (customer) => {
  /**
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_login',
    user_properties: getUserProperties(customer),
  });
  */
};

export const pushPageViewXgen = (xgenClient: XGenClient | null) => {
  if (xgenClient) {
    xgenClient.track.pageView();
  }
};

/** Collection page product impressions **/
export const pushViewItemListDataXgen = (
  xgenClient: XGenClient | null,
  items: SearchProduct[],
  collection: CioCollectionStructure,
  currencyCode = 'USD',
) => {
  if (xgenClient && items.length > 0 && collection) {
    xgenClient.track.categoryView({
      category: collection.display_name,
      items: items.map((item: SearchProduct) => item?.prod_id) || [],
      context: {
        page: {
          name: collection.display_name,
          url: location.pathname,
        },
      },
    });
  }
  /**
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_view_item_list',
    user_properties: getUserProperties(customer),
    ecommerce: {
      currencyCode,
      impressions: getImpressions(items),
    },
  });
  */
};

export const pushViewSearchQueryXgen = (
  xgenClient: XGenClient | null,
  query: string,
  customer: Customer,
  resultsPage: number,
) => {
  if (xgenClient && query) {
    xgenClient.track.searchQuery({
      query,
      deploymentId: 'eaad0dbf-1d4f-4c9a-bdfb-6e431c860cf7', // after merge  https://github.com/pthreemedia/jmlshopifystore/pull/1250 take id from xgenConfig.deploymentId
      queryId: query,
      page: resultsPage,
      context: {
        customer: getUserProperties(customer),
      },
    });
  }
};

/** Search page product impressions  **/
export const pushViewSearchResultsXgen = (
  xgenClient: XGenClient | null,
  items: CioResult[],
  customer: Customer,
  query: string,
  resultsPage: number,
) => {
  if (xgenClient && items.length > 0) {
    xgenClient.track.searchResult({
      items: items.map((item: CioResult) => item.data.id),
      deploymentId: 'eaad0dbf-1d4f-4c9a-bdfb-6e431c860cf7', // after merge  https://github.com/pthreemedia/jmlshopifystore/pull/1250 take id from xgenConfig.deploymentId
      queryId: query,
      query,
      page: resultsPage,
      context: {
        customer: getUserProperties(customer),
      },
    });
  }
};

/** Collection/Search page product click...
this is the product the user clicks on from collection page **/
export const pushSelectItem = (
  product,
  customer,
  currencyCode = 'USD',
  index,
) => {
  /**
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_select_item',
    user_properties: getUserProperties(customer),
    ecommerce: {
      currencyCode,
      click: {
        actionField: {
          list: location.pathname, // this should be the collection page URL
          action: 'click',
        },
        products: getElevarProduct(product, index),
      },
    },
  });
  */
};
export const trackSearchOpen = (xgenClient: XGenClient | null) => {
  if (xgenClient) {
    xgenClient.track.customEvent({
      category: 'search',
      action: 'search_open',
      name: 'search_open',
      value: 'search_open',
    });
  }
};

export const trackSearchClick = (
  xgenClient: XGenClient | null,
  query: string,
  queryId: string,
  deploymentId: string,
  item: string,
  page: number,
) => {
  if (xgenClient && query && item) {
    xgenClient.track.searchClick({
      query,
      queryId,
      deploymentId,
      item,
      page,
    });
  }
};

function sanitizeProductId(productId: string) {
  return productId.split('/').pop() || '';
}

export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/** Product detail view // note the list object which carries from collection page
When user selects variant this will push an additional event with revised product data
**/
export const pushViewItemXgen = (
  xgenClient: XGenClient | null,
  product: ProductRouteProduct,
  customer: Customer,
  currencyCode = 'USD',
  callback?: () => void,
) => {
  if (xgenClient && product) {
    xgenClient.track
      .itemView({
        item: {
          price: parseFloat(product.selectedVariant?.price.amount || '0'),
          id: sanitizeProductId(product.id),
          name: product.title,
          currency: product.selectedVariant?.price.currencyCode || currencyCode,
        },
        context: {
          customer: getUserProperties(customer),
        },
      })
      .then(() => {
        if (callback) {
          callback();
        }
      });
  }
};
declare global {
  interface Window {
    /**
     * Debounced version of pushViewItemXgen.
     * Accepts the same arguments as pushViewItemXgen, plus an optional callback
     * that is invoked after the debounced function executes.
     */
    debouncedPushViewItemXgen: (
      xgenClient: XGenClient | null,
      product: ProductRouteProduct,
      customer: Customer,
      currencyCode?: string,
      callback?: () => void,
    ) => void;
    debounce: ReturnType<typeof debounce<any>>;
  }
}

const debouncedPushViewItemXgen = debounce(pushViewItemXgen, 500);

if (typeof window !== 'undefined') {
  window.debouncedPushViewItemXgen = (
    xgenClient: XGenClient | null,
    product: ProductRouteProduct,
    customer: Customer,
    currencyCode = 'USD',
    callback?: () => void,
  ) => {
    debouncedPushViewItemXgen(
      xgenClient,
      product,
      customer,
      currencyCode,
      callback,
    );
  };
}

/** Add to Cart // note the list object which carries from collection page **/
export const pushAddToCartXgen = (
  xgenClient: XGenClient | null,
  product: ShopifyAnalyticsProduct,
  customer: Customer | undefined,
  currencyCode = 'USD',
) => {
  const productId = sanitizeProductId(product.productGid);

  if (
    xgenClient &&
    productId.length > 0 &&
    product.name &&
    product.price &&
    product.quantity
  ) {
    xgenClient.track.addToCart({
      item: {
        id: productId,
        name: product.name,
        currency: currencyCode,
        price: parseFloat(product.price),
        quantity: product.quantity,
      },
      context: {
        customer: getUserProperties(customer),
      },
    });
  }
  /**
  const [elevarData, wPromoteData] = getCartActionProduct(lineItem, quantity);

  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_add_to_cart',
    user_properties: getUserProperties(customer),
    ecommerce: {
      currencyCode,
      add: {
        actionField: {
          list: location.pathname, // this should be the collection page URL that user clicked product from
        },
        products: elevarData,
      },
    },
  });

  // WPromote
  window.ElevarDataLayer.push({
    event: 'add_to_cart',
    currency: currencyCode,
    value: parseFloat(lineItem.merchandise.price.amount) * quantity,
    items: wPromoteData,
  });
  */
};

/** Remove from Cart // note the list object which carries from collection page **/
export const pushRemoveFromCart = (
  lineItem,
  customer,
  currencyCode = 'USD',
) => {
  /**
  const [elevarData, wPromoteData] = getCartActionProduct(lineItem);

  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_remove_from_cart',
    user_properties: getUserProperties(customer),
    ecommerce: {
      currencyCode,
      remove: {
        actionField: {
          list: location.pathname, // this should be the collection page URL that user clicked product from
        },
        products: elevarData,
      },
    },
  });

  // WPromote
  window.ElevarDataLayer.push({
    event: 'remove_from_cart',
    currency: currencyCode,
    value: parseFloat(lineItem.cost.totalAmount.amount),
    items: wPromoteData,
  });
  */
};

/** View Cart/Mini Cart **/
export const pushViewCart = (cart, customer, currencyCode = 'USD') => {
  /**
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];
  window.ElevarDataLayer.push({
    event: 'dl_view_cart',
    user_properties: getUserProperties(customer),
    cart_total: getCartTotal(cart),
    ecommerce: {
      currencyCode,
      actionField: {
        list: 'Shopping Cart',
      },
      impressions: getElevarProductsFromCart(cart),
    },
  });
  */
};

export const pushNewsletterSubscribe = (customer) => {
  /**
  window.ElevarDataLayer = window.ElevarDataLayer ?? [];

  if (customer.email !== '') {
    window.ElevarDataLayer.push({
      event: 'dl_subscribe',
      lead_type: 'email', // should be "email" or "phone"
      user_properties: {
        customer_email: customer.email,
      },
    });
  }

  if (customer.phone !== '') {
    window.ElevarDataLayer.push({
      event: 'dl_subscribe',
      lead_type: 'phone', // should be "email" or "phone"
      user_properties: {
        customer_phone: customer.phone,
      },
    });
  }

  // WPromote
  window.ElevarDataLayer.push({
    event: 'newsletter_subscribe',
  });
  */
};

// WPromote purchase (added to thank you page)
// WPromote add_payment_info (added via custom pixel)
// WPromote begin_checkout (added via custom pixel)
