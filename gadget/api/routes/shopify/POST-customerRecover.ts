import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'
import { getShopifyClient } from '../../utils/shopify'

const customerRecoverMutation = `
  mutation customerRecover($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors {
        code
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
    const { email } = request.body

    const variables = {
      email,
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(
      customerRecoverMutation,
      variables
    )

    logger.info('Customer recover successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  email: { type: 'string' },
})

export default route
