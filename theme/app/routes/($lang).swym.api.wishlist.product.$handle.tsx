import {json, LoaderFunctionArgs} from '@shopify/remix-oxygen';

export async function loader({params, context}: LoaderFunctionArgs) {
  try {
    const {handle} = params;
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
          handle,
          countryCode: context.localeData.storefrontLocale.country,
        },
      },
    );

    return json({success: true, handle, productData: productData.product});
  } catch (error: any) {
    return json({success: false, error: error.message}, {status: 500});
  }
}
