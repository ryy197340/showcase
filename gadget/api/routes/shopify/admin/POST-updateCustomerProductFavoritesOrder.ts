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

const customerFavouritesOrderUpdateMutation = `
  mutation customerUpdate($input: CustomerInput!) {
    customerUpdate(input: $input) {
      userErrors {
        field
        message
      }
      customer {
        ...CustomerMetafieldsFragment
      }
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
    const { input } = request.body

    const variables = {
      input,
    }

    const shopify = await connections.shopify.forShopDomain(
      'bartesianshop.myshopify.com'
    )

    const responseData = await shopify.graphql(
      customerFavouritesOrderUpdateMutation,
      variables
    )

    logger.info('Update customer product favorites order successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  input: { type: 'object' },
})

export default route
