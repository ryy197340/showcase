import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'
import { getShopifyClient } from '../../utils/shopify'

const customerFragment = `
  fragment CustomerFragment on Customer {
    id
    displayName
    email
    firstName
    lastName
    phone
    tags
    inventory: metafield(namespace: "mobileapp", key: "inventory") {
      id
      value
    }
  }
`

const customerQuery = `
  query customer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      ...CustomerFragment
    }
  }
  ${customerFragment}
`

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { customerAccessToken } = request.body

    const variables = {
      customerAccessToken
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(customerQuery, variables)
    
    logger.info('Getting customer successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  customerAccessToken: { type: 'string' },
})

export default route
