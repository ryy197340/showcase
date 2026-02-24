import {json, type LoaderFunctionArgs} from '@shopify/remix-oxygen';

import {validateLocale} from '~/lib/utils';
import {
  COLOR_SWATCH_QUERY,
  FAMILY_PRODUCT_QUERY,
  PRODUCT_BY_ID_QUERY,
} from '~/queries/shopify/product';

export async function loader({params, context}: LoaderFunctionArgs) {
  validateLocale({context, params});

  const {identifier} = params;
  const isGid =
    typeof identifier === 'string' &&
    identifier.startsWith('gid://shopify/Product');

  let product;

  if (isGid) {
    const {node} = await context.storefront.query<any>(PRODUCT_BY_ID_QUERY, {
      variables: {
        id: identifier,
      },
    });
    product = node;
  } else {
    const {product: productByHandle} = await context.storefront.query<any>(
      FAMILY_PRODUCT_QUERY,
      {
        variables: {
          handle: identifier,
        },
      },
    );
    product = productByHandle;
  }
  // const {product} = await context.storefront.query<any>(FAMILY_PRODUCT_QUERY, {
  //   variables: {
  //     handle,
  //   },
  // });
  const tags = product?.tags
    ?.map((tag) => tag.trim())
    .filter((tag) => tag.includes('Family:'));
  if (tags?.[0]) {
    const colorSwatches = tags[0]
      ? await context.storefront.query(COLOR_SWATCH_QUERY, {
          variables: {
            tag: tags[0] as string,
          },
        })
      : null;
    product.colorSwatches = colorSwatches;
  }
  return json({
    product,
  });
}
