import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';
import React from 'react';

import ShareWishlistPage from '~/lib/swym/components/wishlist/ShareWishlistPage';

export async function loader({params, context, request}: LoaderFunctionArgs) {
  const {lid, hkey} = params;
  const listId = String(lid) || String(hkey) || '';
  const response: any = await context.swymApiClient.fetchListWithContents(
    listId,
  );
  const {list} = response;
  const enrichedContents = await Promise.all(
    list?.listcontents?.map(async (content: any) => {
      try {
        const productUrl = content?.cprops?.ou || content?.du;
        const productHandle = productUrl
          .split('/products/')
          .pop()
          .split('?variant')[0];
        const productData = await context.storefront.query(
          `
          query ($handle: String!, $countryCode: CountryCode!) @inContext(country: $countryCode) {
            product(handle: $handle) {
              id
              title
              description
              images(first: 1) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              featuredImage {
                url
              }
              variants(first: 1) {
                edges {
                  node {
                    id
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        `,
          {
            variables: {
              handle: productHandle,
              countryCode: context.localeData.storefrontLocale.country,
            },
          },
        );

        return {
          ...content,
          productData: productData.product,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Error fetching product data:', error);
        return content;
      }
    }),
  );
  list.listcontents = enrichedContents;
  return json({success: true, data: list, enrichedContents});
}

const SharedWishlistComponent: React.FC = () => {
  return (
    <div className="p-4">
      <ShareWishlistPage />
    </div>
  );
};

export default SharedWishlistComponent;
