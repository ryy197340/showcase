import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'
import { getShopifyClient } from '../../utils/shopify'

const productsQuery = `
  query products($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        handle
        title
        tags
        availableForSale
        images(first: 1) {
          edges {
            node {
              id
              url
            }
          }
        }
        oosCountries: metafield(namespace: "state", key: "out_of_stock") {
          value
        }
        modifiedPrice: metafield(namespace: "custom", key: "modified_pricing") {
          value
        }
        variants(first: 5) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
            }
          }
        }
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
    const { ids, currentCountry } = request.body

    const variables = {
      ids,
      currentCountry,
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(productsQuery, variables)

    logger.info('Getting products successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  ids: { type: 'array' },
  currentCountry: { type: 'string' },
})

export default route
