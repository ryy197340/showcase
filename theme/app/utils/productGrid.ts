import {useMemo} from 'react';

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

export function useFetchActiveSwatches() {
  const cache = useMemo(() => new Map(), []);

  async function fetchActiveSwatches(family: string) {
    const cacheKey = `${family}`;

    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    let shopifyVariationsMap = {};
    try {
      const response = await fetch(
        `/api/colorSwatchesFromShopify?family="${family}"`,
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const familyOfProducts = await response.json();
      shopifyVariationsMap =
        convertFamilyOfProductsToVariationsMap(familyOfProducts);
      cache.set(cacheKey, shopifyVariationsMap);
    } catch (err) {
      console.error('Error fetching data:', err);
    }

    return shopifyVariationsMap;
  }

  return fetchActiveSwatches;
}
