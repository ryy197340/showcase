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

const collectionProductsQuery = `
  query collectionProducts(
    $id: ID!
    $first: Int
    $metafieldNamespace: String!
    $metafieldKey: String!
    $currentCountry: CountryCode
  ) @inContext(country: $currentCountry) {
    node(id: $id) {
      id
      ... on Collection {
        id
        title
        metafields(
          identifiers: [{namespace: $metafieldNamespace, key: $metafieldKey}]
        ) {
          type
          namespace
          key
          value
        }
        oosCountries: metafield(namespace: "state", key: "out_of_stock") {
          value
        }
        canadaPack: metafield(namespace: "global", key: "canada_8_pack") {
          value
        }
        modifiedPrice: metafield(namespace: "custom", key: "modified_pricing") {
          value
        }
        products(first: $first) {
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
    const { id, first, currentCountry } = request.body

    const variables = {
      id,
      first: first || 10,
      currentCountry:
        currentCountry && currentCountry === 'CA' ? currentCountry : 'US',
      metafieldNamespace: 'state',
      metafieldKey: 'out_of_stock',
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(
      collectionProductsQuery,
      variables
    )

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  id: { type: 'string' },
  first: { type: 'number' },
  currentCountry: { type: 'string' },
})

export default route
