import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../../middleware/appCheckAuth'
import { getShopifyAdminClient } from '../../../utils/shopify'

const updateInventoryMutation = `
  mutation UpdateCustomerMeta($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
        email
        metafield(namespace: "mobileapp", key: "inventory") {
          id
          value
        }
      }
      userErrors {
        field
        message
      }
    }
  }
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
      updateInventoryMutation,
      variables
    )

    logger.info('Update customer inventory successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  input: { type: 'object' },
})

export default route
