import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {validateLocale} from '~/lib/utils';
import {PRODUCTS_AND_COLLECTIONS} from '~/queries/shopify/product';

export async function loader({params, context}: LoaderFunctionArgs) {
  validateLocale({context, params});

  const {id} = params;

  const ids = ['gid://shopify/Product/' + id];

  const {productsAndCollections} = await context.storefront.query<any>(
    PRODUCTS_AND_COLLECTIONS,
    {
      variables: {
        ids: ids || [],
      },
    },
  );

  return json(productsAndCollections);
}
