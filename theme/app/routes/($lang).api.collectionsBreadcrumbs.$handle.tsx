import type {Collection as CollectionType} from '@shopify/hydrogen/storefront-api-types';
import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {validateLocale} from '~/lib/utils';
import {COLLECTION_QUERY} from '~/queries/shopify/collection';
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

    if (!collection) {
      return json({collection: ''}, {error: 'no collection found'});
    }

    return collection;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return json({error: 'an error occurred while processing your request'});
  }
}
