import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'
import { getShopifyClient } from '../../utils/shopify'

const sellingPlanGroupFragment = `
  fragment SPGFragment on SellingPlanGroupConnection {
    edges {
      node {
        appName
        name
        sellingPlans(first: 3) {
          edges {
            node {
              id
              name
            }
          }
        }
      }
    }
  }
`

const productQuery = `
  query product($id: ID!, $countryISO: CountryCode)
  @inContext(country: $countryISO) {
    node(id: $id) {
      ... on Product {
        id
        title
        description
        tags
        images(first: 3) {
          edges {
            node {
              id
              url
            }
          }
        }
        modifiedPrice: metafield(namespace: "custom", key: "modified_pricing") {
          value
        }
        variants(first: 20) {
          edges {
            node {
              id
              title
              compareAtPrice {
                amount
                currencyCode
              }
              price {
                amount
                currencyCode
              }
            }
          }
        }
        sellingPlanGroups(first: 3) {
          ...SPGFragment
        }
      }
    }
  }
  ${sellingPlanGroupFragment}
`

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { id, countryISO } = request.body

    const variables = {
      id,
      countryISO,
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(productQuery, variables)

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  id: { type: 'string' },
  countryISO: { type: 'string' },
})

export default route
