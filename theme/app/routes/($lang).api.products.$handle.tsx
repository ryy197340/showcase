import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {validateLocale} from '~/lib/utils';
import {FAMILY_PRODUCT_QUERY} from '~/queries/shopify/product';

export async function loader({params, context}: LoaderFunctionArgs) {
  validateLocale({context, params});

  const {handle} = params;
  const {product} = await context.storefront.query<any>(FAMILY_PRODUCT_QUERY, {
    variables: {
      handle,
    },
  });
  return json({
    product,
  });
}
