import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../../middleware/appCheckAuth'
import { getShopifyAdminClient } from '../../../utils/shopify'

const customerMetafieldsFragment = `
  fragment CustomerMetafieldsFragment on Customer {
    id
    metafields(first: 100) {
      edges {
        node {
          id
          key
          namespace
          type
          value
        }
      }
    }
  }
`

const customerMetafieldsQuery = `
  query customer($id: ID!) {
    customer(id: $id) {
      ...CustomerMetafieldsFragment
    }
  }
  ${customerMetafieldsFragment}
`

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { id } = request.body

    const variables = {
      id,
    }

    const shopify = await connections.shopify.forShopDomain(
      'bartesianshop.myshopify.com'
    )

    const responseData = await shopify.graphql(
      customerMetafieldsQuery,
      variables
    )

    logger.info('Get customer product favorites successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  id: { type: 'string' },
})

export default route
