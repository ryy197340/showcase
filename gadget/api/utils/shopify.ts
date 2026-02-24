import { GraphQLClient } from 'graphql-request'

const isProduction = process.env['NODE_ENV'] == 'production'

export async function getShopifyDefaultClient(connections: any) {
  const shopDomain = isProduction
    ? 'bartesianshop.myshopify.com'
    : 'bartesianshop.myshopify.com'
  const shopify = await connections.shopify.forShopDomain(shopDomain)

  shopify.options.maxRetries = 8
  shopify.options.timeout = {
    connect: 30000,
    request: 60000,
  }

  return shopify
}

export const getShopifyClient = () => {
  const shopifyStoreUrl = process.env.SHOPIFY_STORE_URL ?? ''
  const shopifyStorefrontAccessToken =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? ''

  return new GraphQLClient(shopifyStoreUrl, {
    headers: {
      'X-Shopify-Storefront-Access-Token': shopifyStorefrontAccessToken,
    },
  })
}

export const getShopifyAdminClient = () => {
  const shopifyStoreUrl = process.env.SHOPIFY_ADMIN_URL ?? ''
  const shopifyStorefrontAccessToken =
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? ''

  return new GraphQLClient(shopifyStoreUrl, {
    headers: {
      'X-Shopify-Access-Token': shopifyStorefrontAccessToken,
    },
  })
}