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

const customerCreateMutation = `
  mutation customerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customerUserErrors {
        code
        field
        message
      }
      customer {
        ...CustomerFragment
      }
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
    const { input } = request.body

    const variables = {
      input,
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(
      customerCreateMutation,
      variables
    )

    logger.info('Creating customer successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  input: { type: 'object' },
})

export default route
