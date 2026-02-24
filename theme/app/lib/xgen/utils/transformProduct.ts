import type {RecommendProduct} from '@xgenai/sdk-core';

import type {CioBsResult, CioVariation} from '~/lib/constructor/types';

/**
 * Transforms an XGen RecommendProduct to CioBsResult structure
 */
export function transformXGenToCio(xgenProduct: RecommendProduct): CioBsResult {
  // Extract the first variant for base product data
  const firstVariant = xgenProduct.variants?.[0];

  // Transform main product data
  const cioData: any = {
    id: xgenProduct.prod_code,
    color: (xgenProduct.color || firstVariant?.color || '') as string,
    variation_id: (firstVariant?.id || '') as string,
    description: '', // XGen doesn't provide description in the base structure
    swatch_image: (firstVariant?.swatch || xgenProduct.image || '') as string,
    url: xgenProduct.link || '',
    group_ids: xgenProduct.categories || [],
    activation_date: new Date().toISOString(), // Default to current date
    style_number: firstVariant?.sku || '',
    family: xgenProduct.prod_name,
    bestseller: false,
    price:
      typeof xgenProduct.price === 'string'
        ? parseFloat(xgenProduct.price)
        : xgenProduct.price,
    shopify_id: parseInt(xgenProduct.prod_code),
    image_url: xgenProduct.image || '',
    deactivated: false,
    groups:
      xgenProduct.categories?.map((category) => ({
        display_name: category,
        group_id: category.toLowerCase().replace(/\s+/g, '-'),
        path: category,
      })) || [],
    facets: {},
    publishedAt: new Date().toISOString(),
  };

  // Transform variations
  const variations: CioVariation[] =
    xgenProduct.variants?.map((variant) => ({
      value: xgenProduct.prod_name,
      data: {
        url: xgenProduct.link || '',
        color: (variant.color || xgenProduct.color || '') as string,
        price:
          typeof variant.price === 'string'
            ? Number(parseFloat(variant.price))
            : Number(variant.price),
        image_url: xgenProduct.image || '',
        deactivated: false,
        variation_id: (variant.id || '') as string,
        swatch_image: (variant.swatch || xgenProduct.image || '') as string,
        shopify_id: parseInt(xgenProduct.prod_code),
      },
    })) || [];

  // Create variations map
  const variationsMap: Record<string, any> = {};
  xgenProduct.variants?.forEach((variant) => {
    if (variant.color) {
      variationsMap[variant.color as string] = {
        firstImage: xgenProduct.image || '',
        minPrice:
          typeof variant.price === 'string'
            ? parseFloat(variant.price)
            : variant.price,
        maxPrice:
          typeof variant.price === 'string'
            ? parseFloat(variant.price)
            : variant.price,
        shopify_id: parseInt(xgenProduct.prod_code),
        swatch_image: variant.swatch || xgenProduct.image || '',
        url: xgenProduct.link || '',
      };
    }
  });

  return {
    data: cioData,
    value: xgenProduct.prod_name,
    is_slotted: false,
    labels: {},
    // @ts-expect-error XGen doesn't provide matched_terms
    matched_terms: [],
    variations_map: variationsMap,
    variations,
  };
}

/**
 * Transforms an array of XGen RecommendProduct objects to CioBsResult array
 */
export function transformXGenArrayToCio(
  xgenProducts: RecommendProduct[],
): CioBsResult[] {
  return xgenProducts.map(transformXGenToCio);
}

/**
 * Transforms XGen products to CIO structure (handles both single and array inputs)
 */
export function transformXGenProductsToCio(
  xgenProducts: RecommendProduct | RecommendProduct[],
): CioBsResult | CioBsResult[] {
  if (Array.isArray(xgenProducts)) {
    return transformXGenArrayToCio(xgenProducts);
  }
  return transformXGenToCio(xgenProducts);
}
