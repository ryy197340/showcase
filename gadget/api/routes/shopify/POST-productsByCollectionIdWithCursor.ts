import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'
import { getShopifyClient } from '../../utils/shopify'

const cProductFragment = `
  fragment cProductFragment on ProductConnection {
    edges {
      cursor
      node {
        id
        title
        handle
        tags
        description
        createdAt
        isGiftCard
        availableForSale
        metafields(identifiers: [{namespace: "state", key: "out_of_stock"}]) {
          type
          namespace
          key
          value
        }
        modifiedPrice: metafield(namespace: "custom", key: "modified_pricing") {
          value
        }
        oosCountries: metafield(namespace: "state", key: "out_of_stock") {
          value
        }
        canadaPack: metafield(namespace: "global", key: "canada_8_pack") {
          value
        }
        images(first: 3) {
          edges {
            node {
              id
              url
            }
          }
        }
        variants(first: 10) {
          edges {
            node {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
            }
          }
        }
        sellingPlanGroups(first: 3) {
          edges {
            node {
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
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
`

const collectionProductsWithCursorQuery = `
  query collectionProducts($id: ID!, $cursor: String, $first: Int) {
    node(id: $id) {
      id
      ... on Collection {
        id
        title
        products(first: $first, after: $cursor) {
          ...cProductFragment
        }
      }
    }
  }
  ${cProductFragment}
`

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { id, first, cursor } = request.body

    const variables = {
      id,
      first,
      cursor,
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(
      collectionProductsWithCursorQuery,
      variables
    )

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  id: { type: 'string' },
  first: { type: 'number' },
  cursor: { type: 'string' },
})

export default route
