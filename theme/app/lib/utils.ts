import {useAsyncValue, useFetcher, useMatches} from '@remix-run/react';
import {extract} from '@sanity/mutator';
import type {
  CartLine,
  Collection,
  ComponentizableCartLine,
  Product,
  ProductOption,
  ProductVariant,
} from '@shopify/hydrogen/storefront-api-types';
import {
  type AppLoadContext,
  createCookie,
  json,
  type LoaderFunctionArgs,
} from '@shopify/remix-oxygen';
import {RecommendProduct} from '@xgenai/sdk-core';
import pluralize from 'pluralize-esm';
import {createContext, useEffect, useMemo, useRef} from 'react';

import {countries, countriesWithPath} from '~/data/countries';
import type {
  SanityCollectionPage,
  SanityHomePage,
  SanityModule,
  SanityPage,
  SanityProductPage,
} from '~/lib/sanity';
import {PRODUCTS_AND_COLLECTIONS} from '~/queries/shopify/product';
import type {AdjustedPriceData, I18nLocale, IpData} from '~/types/shopify';

import {CioBsResult, Facet, FacetOption} from './constructor/types';
import {XgenConfigType} from './xgen/types';

// root.tsx
export const SHOP_QUERY = `#graphql
  query layout {
    shop {
      id
      pairWithText: metafield(key: "pair_with_text", namespace: "app--2315872--product_desc") {
        value
      }
    }
    localization {
      availableCountries {
        name
        currency {
          isoCode
          symbol
        }
        isoCode
        availableLanguages {
          isoCode
        }
      }
    }
  }
`;

export const DEFAULT_LOCALE: I18nLocale = Object.freeze({
  ...countries.default,
  pathPrefix: '',
});

interface GlobalContextType {
  cartPods: any;
  facets: any;
  setFacets: any;
  groups: any;
  setGroups: any;
  sortOptions: any;
  setSortOptions: any;
  isAuthenticated: boolean;
  customer: any;
  locale: I18nLocale;
  setLocale: any;
  availableLocales: Locales | undefined;
  ipData: IpData | undefined;
  isLocaleConfirmed: boolean;
  eventTrackingData: {
    cart: any;
    currency: string;
    customer: any;
  };
  xgenConfig: XgenConfigType;
  storeDomain: string;
  OMETRIA_ACCOUNT: string;
}

export const GlobalContext = createContext<GlobalContextType>({
  cartPods: undefined,
  facets: undefined,
  setFacets: undefined,
  groups: undefined,
  setGroups: undefined,
  sortOptions: undefined,
  setSortOptions: undefined,
  isAuthenticated: false,
  customer: undefined,
  locale: DEFAULT_LOCALE,
  setLocale: undefined,
  availableLocales: undefined,
  ipData: undefined,
  isLocaleConfirmed: false,
  eventTrackingData: {
    cart: undefined,
    currency: '',
    customer: undefined,
  },
  xgenConfig: undefined,
  storeDomain: '',
  OMETRIA_ACCOUNT: '',
});

export const TYPE_NAME_MAP = {
  MODEL_3D: 'Model3d',
  VIDEO: 'Video',
  IMAGE: 'MediaImage',
  EXTERNAL_VIDEO: 'ExternalVideo',
};

export function getLocaleFromCountryCode(countryCode?: string): I18nLocale {
  if (countryCode === undefined) return DEFAULT_LOCALE;
  const countrCodeObjectName = `/en-${countryCode.toLowerCase()}`;
  const countries = countriesWithPath;
  const returnValue = countries[countrCodeObjectName]
    ? {
        ...countries[countrCodeObjectName],
        pathPrefix: countrCodeObjectName,
      }
    : {
        ...countries['default'],
        pathPrefix: '',
      };
  return returnValue ? returnValue : DEFAULT_LOCALE;
}

export function getLocaleFromRequestUrl(requestUrl: string): I18nLocale {
  const countries = countriesWithPath;
  const url = new URL(requestUrl);
  const firstPathPart =
    '/' + url.pathname.substring(1).split('/')[0].toLowerCase();
  const returnValue = countries[firstPathPart]
    ? {
        ...countries[firstPathPart],
        pathPrefix: firstPathPart,
      }
    : {
        ...countries['default'],
        pathPrefix: '',
      };
  return returnValue ? returnValue : DEFAULT_LOCALE;
}

export function usePrefixPathWithLocale(path: string) {
  const [root] = useMatches();
  const selectedLocale = root.data?.selectedLocale ?? DEFAULT_LOCALE;

  return `${selectedLocale.pathPrefix}${
    path.startsWith('/') ? path : '/' + path
  }`;
}

export const mapToLocale = (countryData: any): I18nLocale[] => {
  return countryData.availableLanguages.map((language: any) => ({
    language: language.isoCode,
    country: countryData.isoCode,
    label: countryData.name,
    currency: countryData.currency.isoCode,
    path:
      countryData.isoCode === 'US'
        ? ''
        : `${language.isoCode}-${countryData.isoCode}`.toLowerCase(),
  }));
};

export function validateLocale({
  params,
  context,
}: {
  context: LoaderFunctionArgs['context'];
  params: LoaderFunctionArgs['params'];
}) {
  const {language, country} = context.storefront.i18n;
  if (
    params.lang &&
    params.lang.toLowerCase() !== `${language}-${country}`.toLowerCase()
  ) {
    // If the lang URL param is defined, and it didn't match a valid localization,
    // then the lang param must be invalid, send to the 404 page
    throw notFound();
  }
}

export interface Locales {
  [key: string]: I18nLocale;
}
export const createLocales = (availableCountries: any): Locales => {
  const locales: Locales = {};

  // Handle US separately and place it as default
  const usData = availableCountries.find(
    (country: any) => country.isoCode === 'US',
  );
  if (usData) {
    locales['default'] = {
      label: 'United States',
      language: 'EN',
      country: usData.isoCode,
      currency: usData.currency.isoCode,
      pathPrefix: '',
    };
  }
  availableCountries.forEach((countryData: any) => {
    if (countryData.isoCode !== 'US') {
      // Skip US as it's already handled
      countryData.availableLanguages.forEach((language: any) => {
        const pathPrefix =
          `/${language.isoCode}-${countryData.isoCode}`.toLowerCase();
        locales[pathPrefix] = {
          label: countryData.name,
          language: language.isoCode,
          country: countryData.isoCode,
          currency: countryData.currency.isoCode,
          pathPrefix,
        };
      });
    }
  });

  return locales;
};

/**
 * Errors can exist in an errors object, or nested in a data field.
 */
export function assertApiErrors(data: Record<string, any> | null | undefined) {
  const errorMessage = data?.customerUserErrors?.[0]?.message;
  if (errorMessage) {
    throw new Error(errorMessage);
  }
}

/**
 * Map Shopify order status to a human-readable string
 */
export function statusMessage(status: string) {
  const translations: Record<string, string> = {
    ATTEMPTED_DELIVERY: 'Attempted delivery',
    CANCELED: 'Canceled',
    CONFIRMED: 'Confirmed',
    DELIVERED: 'Delivered',
    FAILURE: 'Failure',
    FULFILLED: 'Fulfilled',
    IN_PROGRESS: 'In Progress',
    IN_TRANSIT: 'In transit',
    LABEL_PRINTED: 'Label printed',
    LABEL_PURCHASED: 'Label purchased',
    LABEL_VOIDED: 'Label voided',
    MARKED_AS_FULFILLED: 'Marked as fulfilled',
    NOT_DELIVERED: 'Not delivered',
    ON_HOLD: 'On Hold',
    OPEN: 'Open',
    OUT_FOR_DELIVERY: 'Out for delivery',
    PARTIALLY_FULFILLED: 'Partially Fulfilled',
    PENDING_FULFILLMENT: 'Pending',
    PICKED_UP: 'Displayed as Picked up',
    READY_FOR_PICKUP: 'Ready for pickup',
    RESTOCKED: 'Restocked',
    SCHEDULED: 'Scheduled',
    SUBMITTED: 'Submitted',
    UNFULFILLED: 'Unfulfilled',
  };
  try {
    return translations?.[status];
  } catch (error) {
    return status;
  }
}

/**
 * Combine products and modules into a single array, with modules inserted at
 * regular intervals.
 */
const MODULE_INTERVAL = 2;
const START_INDEX = 2;

export function combineProductsAndModules({
  modules,
  products,
}: {
  products: Product[];
  modules?: SanityModule[];
}) {
  let moduleIndex = 0;
  return products.reduce<(SanityModule | Product)[]>((acc, val, index) => {
    if (index >= START_INDEX && index % MODULE_INTERVAL === 0) {
      const nextModule = modules?.[moduleIndex];
      if (nextModule) {
        acc.push(nextModule);
        moduleIndex += 1;
      }
    }
    acc.push(val);
    return acc;
  }, []);
}

/**
 * Check if a product has multiple options, e.g. Color / Size / Title
 */

export const hasMultipleProductOptions = (options?: ProductOption[]) => {
  const firstOption = options?.[0];
  if (!firstOption) {
    return false;
  }

  return (
    firstOption.name !== 'Title' && firstOption.values[0] !== 'Default Title'
  );
};

/**
 * Get the product options as a string, e.g. "Color / Size / Title"
 */
export const getProductOptionString = (options?: ProductOption[]) => {
  return options
    ?.map(({name, values}) => pluralize(name, values.length, true))
    .join(' / ');
};

type StorefrontPayload = {
  productsAndCollections: Product[] | Collection[];
};

/**
 * Get data from Shopify for page components
 */

export async function fetchGids({
  page,
  context,
}: {
  page: SanityHomePage | SanityPage | SanityCollectionPage | SanityProductPage;
  context: AppLoadContext;
}) {
  const productGids = extract(`..[_type == "productWithVariant"].gid`, page);
  const collectionGids = extract(`..[_type == "collection"].gid`, page);

  const {productsAndCollections} =
    await context.storefront.query<StorefrontPayload>(
      PRODUCTS_AND_COLLECTIONS,
      {
        variables: {
          ids: [...productGids, ...collectionGids],
        },
      },
    );

  return extract(`..[id?]`, productsAndCollections) as (
    | Product
    | Collection
    | ProductVariant
  )[];
}

// TODO: better typing?
export function useGid<
  T extends Product | Collection | ProductVariant | ProductVariant['image'],
>(id?: string | null): T | null | undefined {
  const gids = useRef(useGids());
  const fetcher = useFetcher();
  const [root] = useMatches();
  const selectedLocale = root.data?.selectedLocale;

  const gid = useRef(gids.current.get(id as string) as T | null);

  // In preview mode, if a product or collection is added
  // then the fetcher is used to fetch the new data from
  // the Storefront API
  useEffect(() => {
    if (!gid.current && id) {
      const apiUrl = `${
        selectedLocale && `${selectedLocale.pathPrefix}`
      }/api/fetchgids`;
      if (fetcher.state === 'idle' && fetcher.data == null) {
        fetcher.submit(
          {ids: JSON.stringify([id])},
          {method: 'post', action: apiUrl},
        );
      }

      if (fetcher.data) {
        const newGids = fetcher.data as (
          | Product
          | Collection
          | ProductVariant
        )[];
        if (!Array.isArray(newGids)) {
          return;
        }

        for (const newGid of newGids) {
          if (gids.current.has(newGid.id)) {
            continue;
          }

          gids.current.set(newGid.id, newGid);
        }

        gid.current = gids.current.get(id as string) as T | null;
      }
    }
  }, [gids, id, fetcher, selectedLocale]);

  return gid.current;
}

export function useGids() {
  const gids = useAsyncValue();
  // TODO: this doesnt' seem to actually memoize...
  return useMemo(() => {
    const byGid = new Map<
      string,
      Product | Collection | ProductVariant | ProductVariant['image']
    >();

    if (!Array.isArray(gids)) {
      return byGid;
    }

    for (const gid of gids) {
      if (byGid.has(gid.id)) {
        continue;
      }

      byGid.set(gid.id, gid);
    }

    return byGid;
  }, [gids]);
}

/**
 * A not found response. Sets the status code.
 */
export const notFound = (message = 'Not Found') =>
  new Response(message, {
    status: 404,
    statusText: 'Not Found',
  });

/**
 * A bad request response. Sets the status code and response body
 */
export const badRequest = <T>(data: T) =>
  json(data, {status: 400, statusText: 'Bad Request'});

/**
 * Validates that a url is local to the current request.
 */
export function isLocalPath(request: Request, url: string) {
  // Our domain, based on the current request path
  const currentUrl = new URL(request.url);

  // If url is relative, the 2nd argument will act as the base domain.
  const urlToCheck = new URL(url, currentUrl.origin);

  // If the origins don't match the slug is not on our domain.
  return currentUrl.origin === urlToCheck.origin;
}

export function useDebounce(func: (...args: any[]) => void, delay: number) {
  const timeoutId = useRef<ReturnType<typeof setTimeout>>();

  return (...args: any[]) => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

// Pages and Account Sidebar

export const SIDEBAR_CLASSNAMES =
  'flex flex-col lg:flex-row lg:gap-x-14 max-w-[1200px] w-full mx-auto';

// Order History
export const TH_CLASSES = 'pl-2 py-5 text-left font-regular';
export const ROW_CLASSES = 'pl-2 border-t border-lightGray py-5';

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
};

export const toSentenceCase = (str: string) =>
  str
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const addPathToLocales = (locales: Locales): Locales => {
  Object.keys(locales).forEach((key) => {
    locales[key] = {
      ...locales[key],
      path: key,
    };
  });
  return locales;
};
export const updatedCountries: Locales = addPathToLocales(countries);

// Price per Locale
export const returnPriceData = (
  id: number | undefined,
  priceData: AdjustedPriceData,
) => {
  if (id && priceData && Object.keys(priceData).length > 0) {
    try {
      return priceData[id];
    } catch (error) {
      console.error(error);
    }
  }
};

export const fetchShopifyPrices = async (
  shopifyIds: number[],
  locale: I18nLocale,
): Promise<AdjustedPriceData | null> => {
  if (shopifyIds.length === 0) {
    return null;
  }

  const queryParams = new URLSearchParams();
  shopifyIds.forEach((id) => {
    if (id !== undefined) {
      queryParams.append('ids', id.toString());
    }
  });

  try {
    const response = await fetch(
      `${locale.pathPrefix}/api/prices?${queryParams.toString()}`,
    );
    if (!response.ok) {
      console.error('Server returned an error response:', response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getInventoryStatus = (
  product: {handle: string},
  variant: ProductVariant & {aptosQty?: number},
  threshold: number,
  allowRealTimeCheck = true,
): [boolean, number, boolean] => {
  const isDigitalGiftCard = product.handle === 'digital-gift-card';

  let isOutOfStock = !variant.availableForSale;
  let quantityAvailable = (variant.quantityAvailable ?? 0) - threshold;
  if (isDigitalGiftCard) {
    quantityAvailable = Number.MAX_SAFE_INTEGER;
    isOutOfStock = false;
  } else {
    if (allowRealTimeCheck && typeof variant?.aptosQty === 'number') {
      const aptosQtyAdjusted = variant.aptosQty - threshold;

      // for all products (other than GCs, determine stock based on aptosQty)
      quantityAvailable = aptosQtyAdjusted;
    }

    isOutOfStock = quantityAvailable <= 0;
  }

  return [isOutOfStock, quantityAvailable, isDigitalGiftCard];
};

export const lastPromptTimeCookie = createCookie('lastPromptTime', {
  maxAge: 2592000, // 30 days in seconds
  httpOnly: true,
  secure: true,
  path: '/',
  sameSite: 'lax',
});

export async function needsLocalePrompt(
  request: Request,
  clientInfo: any,
): Promise<boolean> {
  const cookieHeader = request.headers.get('Cookie');
  const lastPromptTime = await lastPromptTimeCookie.parse(cookieHeader);
  const currentTime = Date.now();
  const thirtyDays = 2592000000; // 30 days in milliseconds

  if (
    (!lastPromptTime || currentTime - parseInt(lastPromptTime) > thirtyDays) &&
    clientInfo.country !== 'US'
  ) {
    return true;
  }
  return false;
}

// This function gets client info to determine a locale based on IP address
export function extractClientInfo(request: Request) {
  const ip = request.headers.get('oxygen-buyer-ip');
  const country = request.headers.get('oxygen-buyer-country');
  const region = request.headers.get('oxygen-buyer-region');
  const city = request.headers.get('oxygen-buyer-city');

  return {ip, country, region, city};
}

export function returnAustrianServerInfoForDev(request: Request) {
  const ip = '185.244.212.166';
  const country = 'AT';
  const region = 'Vienna';
  const city = 'Vienna';

  return {ip, country, region, city};
}

// Facets
export const capitalizeString = (str: string) => {
  return str
    .replace(/_/g, ' ')
    .replace(
      /\w\S*/g,
      (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase(),
    );
};

export const returnFacetName = (
  facet: Facet,
  facetFilters: Record<string, string | string[]>,
) => {
  let countOfSelectedOptions = 0;
  let selectedOptionName = '';

  if ('options' in facet) {
    for (const option of facet.options) {
      if (
        facetFilters[facet.name] &&
        facetFilters[facet.name].includes(option.value)
      ) {
        countOfSelectedOptions++;
        selectedOptionName = option.display_name;
      }
    }
  }

  const capitalizedFacetName = capitalizeString(facet.display_name);

  if (countOfSelectedOptions === 0) {
    return capitalizedFacetName;
  } else if (countOfSelectedOptions === 1) {
    return `${capitalizedFacetName}: ${selectedOptionName}`;
  } else {
    return `${capitalizedFacetName}: ${countOfSelectedOptions} options`;
  }
};

// Split camelCase string into words with spaces
export const returnCamelCaseStringWithSpaces = (str: string) => {
  return str.replace(/([a-z])([A-Z])/g, '$1 $2');
};

export const sizeSorter = (a: FacetOption, b: FacetOption) => {
  const order = [
    'XXXS',
    'XXS',
    'XS',
    'XS/S',
    'S/XS',
    'S',
    'S/M',
    'M',
    'M/L',
    'L',
    'L/XL',
    'XL',
    'XXL',
    'XXXL',
    'XXXXL',
    'XXXXXL',
    'OS',
  ];
  const isNumber = (val: string) => /^(\d+|\d+\.\d+)$/.test(val); // Updated to include decimal numbers
  const getOrderIndex = (val: string) => {
    const index = order.indexOf(val.toUpperCase());
    return index === -1 ? Infinity : index;
  };
  const aValue = a.value.split('--').pop() ?? '';
  const bValue = b.value.split('--').pop() ?? '';
  const aIsNumber = isNumber(aValue);
  const bIsNumber = isNumber(bValue);

  // numbers
  if (aIsNumber && bIsNumber) {
    // Special handling for '00'
    if (aValue === '00') return -1;
    if (bValue === '00') return 1;

    // Compare as floating-point numbers
    return parseFloat(aValue) - parseFloat(bValue);
  } else if (!aIsNumber && !bIsNumber) {
    return getOrderIndex(aValue) - getOrderIndex(bValue);
  } else {
    return aIsNumber ? 1 : -1;
  }
};

export const DEFAULT_COLOR_THEME = {text: '#13294e', background: '#ffffff'};

export const returnShopifyIds = (items: CioBsResult[]) =>
  items?.map((item) => item.data.shopify_id);

export const returnLineItemSubtotal = (
  lineItem: CartLine | ComponentizableCartLine,
) => {
  return {
    amount: (parseFloat(lineItem.merchandise.price.amount) * lineItem.quantity)
      .toFixed(2)
      .toString(),
    currencyCode: lineItem.merchandise.price.currencyCode,
  };
};

export const postLocaleCookie = (locale: I18nLocale, newLocale: I18nLocale) =>
  fetch(`${locale.pathPrefix}/api/update-locale`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({locale: newLocale.country}),
  });

export const updateFreeShippingBanner = (newLocale: I18nLocale) => {
  const cacheBuster = Math.floor(new Date().getTime() / (1000 * 60 * 60));
  const src = `https://webservices.global-e.com/merchant/freeShippingBanner?merchantId=30000370&country=${newLocale.country}&currency=${newLocale.currency}&culture=&cb=${cacheBuster}`;
  executeFreeShippingBanner(src, newLocale.country);
};

const executeFreeShippingBanner = async (src: string, country: string) => {
  // Return if GlobalE is not defined
  if (typeof GlobalE == 'undefined') {
    return;
  }
  try {
    const response = await fetch(src);
    const scriptContent = await response.text();
    const existingScripts = document.querySelectorAll(
      '.ge-free-shipping-container',
    );
    existingScripts.forEach((script) => script.remove());
    if (scriptContent) {
      const script = document.createElement('script');
      script.dataset.country = country;
      script.textContent = scriptContent;
      // search for script by dataset.country on dom before appending
      const existingScript =
        document.querySelector(`script[data-country="${country}"]`) ?? null;
      if (existingScript) {
        existingScript.remove();
      }
      document.body.appendChild(script);
    } else {
      // eslint-disable-next-line no-console
      console.log('No content found for the free shipping banner script');
    }
  } catch (error) {
    console.error(
      'Error fetching and executing the free shipping banner script:',
      error,
    );
  }
};

export function storeLocaleInLocalStorage(newLocale: I18nLocale) {
  localStorage.setItem('locale', JSON.stringify(newLocale));
}

export function returnLocaleByCountryCode(
  countryCode: string,
  availableCountries: Locales,
) {
  return Object.values(availableCountries).find(
    (locale) => locale.country === countryCode,
  );
}

export function updateBuyerIdentity(countryCode: string) {
  const requestBody = {
    countryCode,
  };
  fetch(`/api/updateBuyerIdentity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody), // Convert the JavaScript object to a JSON string
  })
    .then((response) => {
      if (!response.ok) {
        // Handle HTTP errors
        console.error(`Error updating buyer identity: ${response.statusText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Optionally do something with the response data
    })
    .catch((error) => {
      // Handle network or parsing errors
      console.error('Error updating buyer identity:', error);
    });
}

// collection route
// wpromote

// Function to convert structured JSON to HTML
export function jsonToHtml(json: string) {
  if (!json) {
    return '';
  }

  const obj = JSON.parse(json);
  return convertNodeToHtml(obj);
}

// Helper function to handle each node type
export function convertNodeToHtml(node: {
  italic: string;
  bold: string;
  type: any;
  children: any[];
  value: any;
  url: any;
  title: any;
  level: any;
}): string {
  switch (node.type) {
    case 'root':
      return node.children.map(convertNodeToHtml).join('');
    case 'paragraph':
      return `<p>${node.children.map(convertNodeToHtml).join('')}</p>`;
    case 'text':
      node.bold && (node.value = `<strong>${node.value}</strong>`);
      node.italic && (node.value = `<em>${node.value}</em>`);
      return node.value;
    case 'link':
      return `<a href="${node.url}" title="${
        node.title || ''
      }" class="font-bold">${node.children
        .map(convertNodeToHtml)
        .join('')}</a>`;
    case 'heading':
      return `<h${node.level} class="${
        node.level === 2
          ? 'text-[16px] uppercase'
          : node.level === 3
          ? 'text-[14px] capitalize'
          : ''
      } font-semibold font-gotham tracking-[1.2px]">${node.children
        .map(convertNodeToHtml)
        .join('')}</h${node.level}>`;
    default:
      return ''; // handle unknown types or add more cases as needed
  }
}

/**
 * Input validation for user-generated profile fields
 * Protects against injection attacks and data integrity issues
 *
 * Allows: letters (unicode), numbers, spaces, hyphens, apostrophes, periods
 * Rejects: quotes, angle brackets, equals, control characters (CR/LF/TAB), null
 */
export function validateProfileName(
  value: string,
  fieldName = 'Name',
  maxLength = 50,
): {isValid: boolean; error?: string} {
  // Empty values are allowed (optional field)
  if (!value || value.trim().length === 0) {
    return {isValid: true};
  }

  // Check length
  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be ${maxLength} characters or less.`,
    };
  }

  // Check for dangerous characters: quotes, angle brackets, equals, control chars
  // eslint-disable-next-line no-control-regex
  const dangerousCharsRegex = /["'<>=\r\n\t\0\x0B\x0C\x1B]/;
  if (dangerousCharsRegex.test(value)) {
    return {
      isValid: false,
      error: `${fieldName} contains invalid characters. Please use only letters, numbers, spaces, hyphens, and apostrophes.`,
    };
  }

  // Allow-list: Unicode letters/marks, numbers, spaces, hyphens, apostrophes, periods
  const allowedCharsRegex = /^[\p{L}\p{M}0-9\s\-'.]+$/u;
  if (!allowedCharsRegex.test(value)) {
    return {
      isValid: false,
      error: `${fieldName} contains invalid characters. Please use only letters, numbers, spaces, hyphens, and apostrophes.`,
    };
  }

  return {isValid: true};
}

/**
 * Validates phone number field for profile
 * Allows: digits, spaces, hyphens, parentheses, plus sign
 * Rejects: HTML special characters, control characters
 */
export function validatePhone(
  value: string,
  maxLength = 20,
): {isValid: boolean; error?: string} {
  if (!value || value.trim().length === 0) {
    return {isValid: true}; // Empty is allowed (optional field)
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `Phone number must be ${maxLength} characters or less.`,
    };
  }

  // Check for dangerous characters
  // eslint-disable-next-line no-control-regex
  const dangerousCharsRegex = /["'<>=\r\n\t\0\x0B\x0C\x1B]/;
  if (dangerousCharsRegex.test(value)) {
    return {
      isValid: false,
      error: 'Phone number contains invalid characters.',
    };
  }

  // Allow-list: digits, spaces, hyphens, parentheses, plus, dot
  const allowedCharsRegex = /^[0-9\s\-()+ .]+$/;
  if (!allowedCharsRegex.test(value)) {
    return {
      isValid: false,
      error:
        'Phone number contains invalid characters. Please use only digits, spaces, hyphens, and parentheses.',
    };
  }

  return {isValid: true};
}

/**
 * Sanitizes a string for use in CSV exports
 * Prevents formula injection attacks in spreadsheet applications
 */
export function sanitizeForCSV(value: string): string {
  if (!value) return '';

  // Strip leading formula characters: =, +, -, @
  const formulaChars = ['=', '+', '-', '@'];
  let sanitized = value;
  while (formulaChars.includes(sanitized.charAt(0))) {
    sanitized = sanitized.substring(1);
  }

  // Remove CR/LF that could break CSV format
  sanitized = sanitized.replace(/[\r\n]/g, ' ');

  return sanitized;
}

/**
 * Sanitizes a string for use in email contexts
 * Prevents header injection attacks (Bcc, Cc, Subject manipulation)
 */
export function sanitizeForEmail(value: string): string {
  if (!value) return '';

  // Remove CR/LF that could be used for header injection
  return value.replace(/[\r\n]/g, ' ').trim();
}

/**
 * Validates email addresses
 * Server-side validation (complements HTML5 email input)
 */
export function validateEmail(value: string): {
  isValid: boolean;
  error?: string;
} {
  if (!value || value.trim().length === 0) {
    return {isValid: true}; // Empty is allowed (optional in some contexts)
  }

  if (value.length > 254) {
    // RFC 5321 max email length
    return {
      isValid: false,
      error: 'Email address is too long.',
    };
  }

  // Basic email regex - allows most valid emails while rejecting obvious invalid formats
  // Prevents: common injection payloads, spaces, newlines, quotes
  const emailRegex = /^[^\s"'<>@\r\n]+@[^\s"'<>@\r\n]+\.[^\s"'<>@\r\n]+$/;
  if (!emailRegex.test(value)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address.',
    };
  }

  return {isValid: true};
}

/**
 * Validates address fields (street address, city, province)
 * Allows: letters (unicode), numbers, spaces, hyphens, apostrophes, periods, commas
 * Rejects: HTML special characters, control characters, quotes, angle brackets
 */
export function validateAddressField(
  value: string,
  fieldName = 'Address field',
  maxLength = 100,
): {isValid: boolean; error?: string} {
  if (!value || value.trim().length === 0) {
    return {isValid: true}; // Empty is allowed (some fields optional)
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName} must be ${maxLength} characters or less.`,
    };
  }

  // Reject dangerous characters
  // eslint-disable-next-line no-control-regex
  const dangerousCharsRegex = /["'<>=\r\n\t\0\x0B\x0C\x1B]/;
  if (dangerousCharsRegex.test(value)) {
    return {
      isValid: false,
      error: `${fieldName} contains invalid characters.`,
    };
  }

  // Allow-list: Unicode letters/marks, numbers, spaces, common address chars
  const allowedCharsRegex = /^[\p{L}\p{M}0-9\s\-',.&/]+$/u;
  if (!allowedCharsRegex.test(value)) {
    return {
      isValid: false,
      error: `${fieldName} contains invalid characters.`,
    };
  }

  return {isValid: true};
}

/**
 * Validates postal/zip codes
 * Allows: letters, numbers, spaces, hyphens
 * Rejects: HTML special characters, control characters
 */
export function validatePostalCode(
  value: string,
  maxLength = 20,
): {isValid: boolean; error?: string} {
  if (!value || value.trim().length === 0) {
    return {isValid: true}; // Empty is allowed (optional)
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `Postal code must be ${maxLength} characters or less.`,
    };
  }

  // Reject dangerous characters
  // eslint-disable-next-line no-control-regex
  const dangerousCharsRegex = /["'<>=\r\n\t\0\x0B\x0C\x1B]/;
  if (dangerousCharsRegex.test(value)) {
    return {
      isValid: false,
      error: 'Postal code contains invalid characters.',
    };
  }

  // Allow-list: unicode letters, numbers, spaces, hyphens (supports various formats worldwide)
  // Examples: 12345, K1A 0B1 (Canada), SW1A 1AA (UK), 75001 (France), etc.
  const allowedCharsRegex = /^[\p{L}0-9\s-]+$/u;
  if (!allowedCharsRegex.test(value)) {
    return {
      isValid: false,
      error: 'Postal code contains invalid characters.',
    };
  }

  return {isValid: true};
}

/**
 * Validates birthday month
 * Ensures value is within valid range (1-12)
 */
export function validateBirthdayMonth(value: number): {
  isValid: boolean;
  error?: string;
} {
  if (typeof value !== 'number' || isNaN(value)) {
    return {
      isValid: false,
      error: 'Please select a valid month.',
    };
  }

  if (value < 1 || value > 12) {
    return {
      isValid: false,
      error: 'Month must be between 1 and 12.',
    };
  }

  return {isValid: true};
}
