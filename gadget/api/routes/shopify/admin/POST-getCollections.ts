import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../../middleware/appCheckAuth'
import { getShopifyAdminClient } from '../../../utils/shopify'

const metafieldFragment = `
  fragment MetafieldFragment on MetafieldConnection {
    edges {
      node {
        key
        value
      }
    }
  }
`

const allCollectionQuery = `
  query collections($first: Int, $metafieldNamespace: String) {
    collections(first: $first) {
      edges {
        node {
          id
          descriptionHtml
          handle
          title
          image {
            id
            originalSrc
          }
          metafields(namespace: $metafieldNamespace, first: 10) {
            ...MetafieldFragment
          }
        }
      }
    }
  }
  ${metafieldFragment}
`

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { first, metafieldNamespace, metafieldKey } = request.body

    const variables = {
      first, metafieldNamespace, metafieldKey,
    }

    const shopify = await connections.shopify.forShopDomain(
      'bartesianshop.myshopify.com'
    )

    const responseData = await shopify.graphql(
      allCollectionQuery,
      variables
    )

    logger.info('Get collections successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  first: { type: 'number' },
  metafieldNamespace: { type: 'string' },
  metafieldKey: { type: 'string' },
})

export default route
