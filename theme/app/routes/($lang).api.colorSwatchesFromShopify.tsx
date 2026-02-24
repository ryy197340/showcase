import {LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {VARIATIONS_COLOR_SWATCH_QUERY} from '~/queries/shopify/product';
import {getQueryParam} from '~/utils/global';

type ColorSwatches = {
  products: {
    edges: {
      node: {
        activation_date: string | null;
        back_image: any;
        featuredImage: any;
        bestseller: boolean | null;
        handle: string;
        id: string;
        options: any;
        title: string;
        totalInventory: number;
        tags: string[];
        variants: {
          edges: {
            node: {
              availableForSale: boolean;
              quantityAvailable: number;
              selectedOptions: {
                name: string;
                value: string;
              }[];
            };
          }[];
        };
      };
    }[];
  };
};

export async function loader({context, request}: LoaderFunctionArgs) {
  const paramsToExtract = ['family'];
  const aptosQtyThreshold = context.env.APTOS_QTY_THRESHOLD
    ? parseInt(context.env.APTOS_QTY_THRESHOLD, 10)
    : 1;
  const queryParams = Object.fromEntries(
    paramsToExtract.map((param) => [param, getQueryParam(request.url, param)]),
  );
  let {family} = queryParams;
  family = family ? family.replace(/^"|"$/g, '') : null;

  // get color swatches from shopify and use cioFamilyTag for CIO recommendations
  const familyTag = family.startsWith('Family: ')
    ? family
    : 'Family: ' + family;
  let colorSwatches: ColorSwatches | null = null,
    filteredColorSwatches: ColorSwatches | null = null;
  try {
    colorSwatches = familyTag
      ? await context.storefront.query(VARIATIONS_COLOR_SWATCH_QUERY, {
          variables: {
            tag: familyTag as string,
          },
        })
      : null;
    // Filter out color swatches that have a totalInventory greater than aptosQtyThreshold
    if (colorSwatches?.products?.edges) {
      filteredColorSwatches = {
        products: {
          edges: colorSwatches.products.edges.filter(
            (product) =>
              product.node.tags.includes(familyTag) &&
              product.node.variants.edges.some(
                (variant) => variant.node.quantityAvailable > 0,
              ),
          ),
        },
      };
    } else {
      filteredColorSwatches = null;
    }
  } catch (error) {
    console.error('Error:', error);
    colorSwatches = null;
  }

  return {
    colorSwatches: filteredColorSwatches,
  };
}
