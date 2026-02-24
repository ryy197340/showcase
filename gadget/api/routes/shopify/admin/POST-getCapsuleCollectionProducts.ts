import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../../middleware/appCheckAuth'
import { getShopifyAdminClient } from '../../../utils/shopify'

const metafieldFragment = `
  fragment MetafieldFragment on MetafieldConnection {
    edges {
      node {
        key
        value
      }
    }
  }
`

const adminCapsuleProductFragment = `
  fragment AdminCapsuleProductFragment on ProductConnection {
    edges {
      cursor
      node {
        id
        title
        tags
        status
        oosCountries: metafield(namespace: "state", key: "out_of_stock") {
          value
        }
        canadaPack: metafield(namespace: "global", key: "canada_8_pack") {
          value
        }
        modifiedPrice: metafield(namespace: "custom", key: "modified_pricing") {
          value
        }
        variants(first: 5) {
          edges {
            node {
              availableForSale
              inventoryQuantity
              id
              title
            }
          }
        }
        images(first: 3) {
          edges {
            node {
              id
              originalSrc
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
  ${metafieldFragment}
`

const adminCapsuleProductsQuery = `
  query collectionProducts($id: ID!, $first: Int, $metafieldNamespace: String) {
    collection(id: $id) {
      id
      title
      metafields(namespace: $metafieldNamespace, first: 5) {
        ...MetafieldFragment
      }
      products(first: $first) {
        ...AdminCapsuleProductFragment
      }
    }
  }
  ${adminCapsuleProductFragment}
`

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { id, first, metafieldNamespace, metafieldKey } = request.body

    const variables = {
      id,
      first,
      metafieldNamespace,
      metafieldKey,
    }

    const shopify = await connections.shopify.forShopDomain(
      'bartesianshop.myshopify.com'
    )

    const responseData = await shopify.graphql(
      adminCapsuleProductsQuery,
      variables
    )

    logger.info('Get capsule collection product successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  id: { type: 'string' },
  first: { type: 'number' },
  metafieldNamespace: { type: 'string' },
  metafieldKey: { type: 'string' },
})

export default route
