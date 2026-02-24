import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../../middleware/appCheckAuth'
import { getShopifyAdminClient } from '../../../utils/shopify'

const productFragment = `
  fragment AllProductFragment on ProductConnection {
    edges {
      cursor
      node {
        id
        descriptionHtml
        handle
        title
        status
        totalInventory
        publishedOnCurrentPublication
        modifiedPrice: metafield(namespace: "custom", key: "modified_pricing") {
          value
        }
        images(first: 3) {
          edges {
            node {
              id
              url
            }
          }
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
`

const allProductsFromQuery = `
  query products($first: Int, $query: String) {
    products(first: $first, query: $query) {
      ...AllProductFragment
    }
  }
  ${productFragment}
`
/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { first, query } = request.body

    const variables = {
      first, query
    }

    const shopify = await connections.shopify.forShopDomain(
      'bartesianshop.myshopify.com'
    )

    const responseData = await shopify.graphql(
      allProductsFromQuery,
      variables
    )

    logger.info('Get products from successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  first: { type: 'number' },
  query: { type: 'string' },
})

export default route
