import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../../middleware/appCheckAuth'
import { getShopifyAdminClient } from '../../../utils/shopify'

const customerDeleteMutation = `
  mutation customerDelete($input: CustomerDeleteInput!) {
    customerDelete(input: $input) {
      deletedCustomerId
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
      customerDeleteMutation,
      variables
    )

    logger.info('Customer deleted successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  input: { type: 'object' },
})

export default route
