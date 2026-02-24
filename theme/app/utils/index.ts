import {
  COLLECTION_COLORS,
  DEFAULT_PRODUCT_GRID_NUMBER,
  LARGE_TABLET_WIDTH,
  SMALL_TABLET_WIDTH,
} from './constants';
export interface SearchResultsParameters {
  i?: string;
  s?: string;
  ui?: string;
  filterName?: string;
  filterValue?: string;
  key?: string;
  query?: string;
  parameters: {
    filters: {
      [key: string]: string[] | string;
    };
    sortBy: string | null;
    sortOrder: string | null;
  };
}

type SearchResultsParametersProps = {
  searchString?: string;
};

export function parseUrlParameters(
  props: SearchResultsParametersProps = {},
): SearchResultsParameters {
  const {searchString} = props;
  let urlSearchParams: URLSearchParams;
  const search =
    searchString ||
    (typeof window !== 'undefined' ? window.location.search : '');
  const decodedURI = decodeURIComponent(search);

  // Custom functionality - allows usage of cnstrc request urls in the search bar
  if (decodedURI.match(/cnstrc.com\/search\//)) {
    const reformattedUrl = decodedURI.replace(/\?q=.+search\/(.+)\?/, '?q=$1&');

    urlSearchParams = new URLSearchParams(reformattedUrl);
  } else if (decodedURI.match(/cnstrc.com\/browse\//)) {
    const reformattedUrl = decodedURI.replace(
      /\?q=.+browse\/([^/]+)\/([^/]+)\?/,
      '?filterName=$1&filterValue=$2&',
    );

    urlSearchParams = new URLSearchParams(reformattedUrl);
  } else {
    // Standard functionality
    urlSearchParams = new URLSearchParams(search);
  }
  const searchResultsParameters: SearchResultsParameters = {
    parameters: {
      filters: {},
      sortBy: null,
      sortOrder: null,
    },
  };

  for (const [key, value] of urlSearchParams) {
    // Custom functionality - allows usage of cnstrc request urls in the search bar
    if (key === 'i') {
      searchResultsParameters.i = value;
    }
    if (key === 's') {
      searchResultsParameters.s = value;
    }
    if (key === 'ui') {
      searchResultsParameters.ui = value;
    }
    if (key === 'filterName') {
      searchResultsParameters.filterName = value;
    }
    if (key === 'filterValue') {
      searchResultsParameters.filterValue = value;
    }
    if (key === 'key') {
      searchResultsParameters.key = value;
    }

    // Standard functionality
    // key is a query
    if (key === 'q') {
      searchResultsParameters.query = value;
    }
    if (key === 'sort_by') {
      searchResultsParameters.parameters.sortBy = value;
    }
    if (key === 'sort_order') {
      searchResultsParameters.parameters.sortOrder = value;
    }
    // key is a filter
    const filterMatch = key.match(/filters\[(\w+)\]/);

    if (filterMatch?.length) {
      searchResultsParameters.parameters.filters[filterMatch?.[1]] =
        value.split(',');
    }
    // key is category
    if (key === 'group_id') {
      searchResultsParameters.parameters.filters.group_id = value;
    }
  }
  return searchResultsParameters;
}

export const variationsMap = {
  group_by: [{name: 'colorGroup', field: 'data.color'}],
  values: {
    firstImage: {
      aggregation: 'first',
      field: 'data.image_url',
    },
    swatch_image: {
      aggregation: 'first',
      field: 'data.swatch_image',
    },
    back_image: {
      aggregation: 'first',
      field: 'data.back_image',
    },
    minPrice: {
      aggregation: 'min',
      field: 'data.price',
    },
    maxPrice: {
      aggregation: 'max',
      field: 'data.price',
    },
    shopify_id: {
      aggregation: 'first',
      field: 'data.shopify_id',
    },
    url: {
      aggregation: 'first',
      field: 'data.url',
    },
    data: {
      aggregation: 'first',
      field: 'data',
    },
  },
  dtype: 'object',
};

function getSlottedContentValues(slottedContent: Array<any> | undefined) {
  if (!slottedContent) {
    return undefined;
  }
  const viewportWidth = window.innerWidth;

  const values = slottedContent.map((content) => {
    let value = 0;

    if (viewportWidth < LARGE_TABLET_WIDTH) {
      // Large tablet/Small desktop
      const widthMobileRadio = content.widthMobileRadio;
      if (widthMobileRadio === '50 (33% tablet)') {
        value = 1;
      } else if (widthMobileRadio === '100') {
        // 2 for mobile, 3 for tablet
        value = viewportWidth < SMALL_TABLET_WIDTH ? 2 : 3;
      }
    } else {
      // Desktop
      const widthRadio = content.widthRadio;
      if (widthRadio === '25') {
        value = 1;
      } else if (widthRadio === '50') {
        value = 2;
      } else if (widthRadio === '100') {
        value = 4;
      }
    }
    return value;
  });

  return values.reduce((acc, val) => acc + val, 0);
}

export function getColorByName(colorName: string) {
  return COLLECTION_COLORS[colorName];
}

export function stripGlobalId(globalId: any): string {
  if (!globalId) return '';

  const stringCastedGid = globalId.toString();

  if (!stringCastedGid.includes('gid://')) return globalId;

  const id = stringCastedGid.split('/').pop();
  if (typeof id === 'undefined') return globalId;

  return id;
}

export async function sha1(string: string) {
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(string));

  return Array.from(new Uint8Array(hash))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
}

export async function sha256(message: string) {
  // encode as UTF-8
  const msgBuffer = new TextEncoder().encode(message);

  // hash the message
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

  // convert ArrayBuffer to Array
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  // convert bytes to hex string
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

/**
 * Enforces a minimum page number of 1
 * **NOTE:** XGen page numbers are 0-indexed so this result will need to be adjusted accordingly
 * before API calls.
 * @param page The page number
 * @param castTo Whether to cast the page number to a number or string
 * @returns The page number as the incoming type or the cast type
 */
export function toPageNumber(
  page: number | string | null | undefined,
  castTo?: typeof Number | typeof String,
) {
  page = page || 1;
  const num = Math.max(parseInt(page.toString(), 10), 1);

  if (castTo) {
    return castTo === Number ? num : String(num);
  }

  // When castTo is undefined, return the same type as the input
  return typeof page === 'string' ? String(num) : num;
}

/**
 * Extracts the page and per page numbers from the URL
 * @param url The URL to extract the page and per page numbers from
 * @returns The page and per page numbers. `perPage` defaults to `DEFAULT_PRODUCT_GRID_NUMBER` if not present. `page` defaults to 1 if not present.
 */
export function extractPageAndPerPageFromUrl(url: string) {
  // Handle full URLs by extracting search params properly
  let searchParams: URLSearchParams;
  if (url.includes('://')) {
    // Full URL - extract search params using URL constructor
    const urlObj = new URL(url);
    searchParams = urlObj.searchParams;
  } else {
    // Already just search params (like from location.search)
    searchParams = new URLSearchParams(url);
  }

  const page = searchParams.get('page');
  const perPage = searchParams.get('per_page');

  return {
    page: page ? (toPageNumber(page, Number) as number) : 1,
    perPage: perPage
      ? (toPageNumber(perPage, Number) as number)
      : DEFAULT_PRODUCT_GRID_NUMBER,
  };
}
