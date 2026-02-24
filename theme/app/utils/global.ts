import {Locale} from '~/types/shopify';

export const returnLocalePrefixPath = (locale: Locale) => {
  if (locale.country.toLowerCase() === 'en') {
    return '';
  } else {
    return `/${returnLocalePrefix(locale)}`;
  }
};

export const returnLocalePrefix = (locale: Locale) => {
  if (locale.country.toLowerCase() === 'en') {
    return '';
  } else {
    return `${locale.language}-${locale.country}`.toLowerCase();
  }
};

export const getCookie = (cookie: string, cname: string) => {
  const name = cname + '=';
  const decodedCookie = decodeURIComponent(cookie);
  const ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

export function getQueryParam(query: string, name: string) {
  const url = new URL(query);
  return url.searchParams.get(name);
}

export function setGlobalEScript(storeDomain: string | string[]) {
  const environment = storeDomain.includes('dev') ? 'staging' : 'production';
  // Determine the environment and load the appropriate script
  if (environment === 'staging') {
    const script = document.createElement('script');
    script.async = true;
    // Load staging-specific script
    script.src =
      'https://crossborder-integration-qa-int.bglobale.com/resources/js/app?shop=jmclaughlin-dev.myshopify.com';
    document.head.appendChild(script);
  } else {
    const script = document.createElement('script');
    script.async = true;
    // Load production-specific script
    script.src =
      'https://crossborder-integration.global-e.com/resources/js/app?shop=jmclaughlin.myshopify.com';
    document.head.appendChild(script);
  }
}

export function updateGlblParams(
  countryCode: string,
  currencyCode: string,
  storeDomain: string,
) {
  window.GLBE_PARAMS = window.GLBE_PARAMS ? window.GLBE_PARAMS : {};
  window.GLBE_PARAMS.countryCode = countryCode;
  window.GLBE_PARAMS.currencyCode = currencyCode;
  window.GLBE_PARAMS.isExternal = true;
  setGlobalEScript(storeDomain);
}

export function convertFamilyOfProductsToVariationsMap(
  familyOfProducts: any,
): any {
  // Helper to get a property with a fallback
  const getProp = (obj: any, path: string, defaultValue: any = 'Unknown') => {
    return (
      path.split('.').reduce((acc, part) => acc && acc[part], obj) ||
      defaultValue
    );
  };

  // Helper to extract the first value of an option if it matches a given name
  const getFirstOptionValue = (node: any, optionName: string) => {
    const option = node.options.find(
      (o: any) => o.name.toLowerCase() === optionName,
    );
    return option ? option.values[0] : 'Unknown';
  };

  return familyOfProducts.colorSwatches.products.edges.map((product: any) => {
    const node = product.node;
    const color = getFirstOptionValue(node, 'color');
    const url = `/products/${node.handle}`;
    const variationDetails = {
      firstImage: getProp(node, 'featuredImage.url'),
      swatch_image: getProp(node, 'metafield.reference.image.url'),
      back_image: getProp(node, 'back_image.reference.image.url'),
      minPrice: Number(getProp(node, 'priceRange.minVariantPrice.amount', 0)),
      maxPrice: Number(getProp(node, 'priceRange.maxVariantPrice.amount', 0)),
      shopify_id: Number(node.id?.split('/').pop()),
      url,
      data: {
        url,
        color,
        price: getProp(node, 'priceRange.minVariantPrice.amount', 0),
        image_url: getProp(node, 'metafield.reference.image.url'),
      },
    };

    return {[color]: variationDetails};
  });
}

export function isProduction(url: string) {
  const urlObj = new URL(url);
  return urlObj.hostname.includes('localhost') ||
    urlObj.hostname.includes('myshopify')
    ? false
    : true;
}
