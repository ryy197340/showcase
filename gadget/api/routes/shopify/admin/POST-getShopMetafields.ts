import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../../middleware/appCheckAuth'
import { getShopifyAdminClient } from '../../../utils/shopify'

const shopMetafieldsFragment = `
  fragment ShopMetafieldsFragment on MetafieldConnection {
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
`

const shopMetafieldsQuery = `
  query shop($first: Int, $metafieldNamespace: String) {
    shop {
      name
      metafields(first: $first, namespace: $metafieldNamespace) {
        ...ShopMetafieldsFragment
      }
    }
  }
  ${shopMetafieldsFragment}
`
/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { first, metafieldNamespace } = request.body

    const variables = {
      first,
      metafieldNamespace,
    }

    const shopify = await connections.shopify.forShopDomain(
      'bartesianshop.myshopify.com'
    )

    const responseData = await shopify.graphql(shopMetafieldsQuery, variables)

    logger.info('Get shop metafields successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  first: { type: 'number' },
  metafieldNamespace: { type: 'string' },
})

export default route
