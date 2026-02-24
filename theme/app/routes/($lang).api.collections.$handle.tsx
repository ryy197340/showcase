import type {Collection as CollectionType} from '@shopify/hydrogen/storefront-api-types';
import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {ExtendedProduct} from '~/lib/shopify/types';
import {validateLocale} from '~/lib/utils';
import {COLLECTION_QUERY} from '~/queries/shopify/collection';
import {COLOR_SWATCH_QUERY} from '~/queries/shopify/product';
const PAGINATION_SIZE = 12;

export async function loader({params, context, request}: LoaderFunctionArgs) {
  try {
    validateLocale({context, params});

    const {handle} = params;
    const searchParams = new URL(request.url).searchParams;
    const cursor = searchParams.get('cursor');
    const count = searchParams.get('count');

    const {collection}: {collection: CollectionType} =
      await context.storefront.query<any>(COLLECTION_QUERY, {
        variables: {
          handle,
          cursor,
          count: count ? parseInt(count) : PAGINATION_SIZE,
        },
      });

    const products: ExtendedProduct[] = collection?.products?.nodes;

    if (!products) {
      return json({collection: ''});
    }

    for (const product of products) {
      if (product.tags) {
        const tags = product.tags
          .map((tag) => tag.trim())
          .filter((tag) => tag.includes('Family:'));
        if (tags[0]) {
          const colorSwatches = tags[0]
            ? await context.storefront.query(COLOR_SWATCH_QUERY, {
                variables: {
                  tag: tags[0] as string,
                },
              })
            : null;
          product.colorSwatches = colorSwatches;
        }
      }
    }

    return json({
      collection,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return json(
      {error: 'An error occurred while processing your request.'},
      {status: 500},
    );
  }
}
