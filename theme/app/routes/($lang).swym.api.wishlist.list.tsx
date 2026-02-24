import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({context}: LoaderFunctionArgs) {
  try {
    const result = await context.swymApiClient.fetchWishlist();

    const enrichedWishlist = await Promise.all(
      result.map(async (item: any) => {
        const response: any = await context.swymApiClient.fetchListWithContents(
          item.lid,
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

              if (!productData || !productData.product) {
                throw new Error('Product not found');
              }
              return {
                ...content,
                productData: productData.product,
              };
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn('Error fetching product data:', error);
              return null;
            }
          }),
        );

        const filteredContents = enrichedContents.filter(
          (content: any) => content !== null,
        );
        const ogList = list?.listcontents || [];
        const ogListCount = list.cnt;
        return {
          ...item,
          ...list,
          listcontents: filteredContents,
          ogList,
          ogListCount,
          cnt: filteredContents.length,
        };
      }),
    );

    return json({success: true, data: enrichedWishlist});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
