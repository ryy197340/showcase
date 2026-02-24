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

const productsWithCursorFromQuery = `
  query products($cursor: String, $first: Int, $query: String) {
    products(first: $first, query: $query, after: $cursor) {
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
    const { first, query, cursor } = request.body

    const variables = {
      first, query, cursor
    }

    const shopify = await connections.shopify.forShopDomain(
      'bartesianshop.myshopify.com'
    )

    const responseData = await shopify.graphql(
      productsWithCursorFromQuery,
      variables
    )

    logger.info('Get products from with cursor successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  first: { type: 'number' },
  query: { type: 'string' },
  cursor: { type: 'string' },
})

export default route
