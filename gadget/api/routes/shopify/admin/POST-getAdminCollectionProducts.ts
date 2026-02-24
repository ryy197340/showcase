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

const adminPoductFragment = `
  fragment AdmincProductFragment on ProductConnection {
    edges {
      cursor
      node {
        id
        title
        handle
        tags
        status
        publishedOnCurrentPublication
        images(first: 3) {
          edges {
            node {
              id
              originalSrc
            }
          }
        }
        metafields(first: 5, namespace: $metafieldNamespace) {
          ...MetafieldFragment
        }
        variants(first: 10) {
          edges {
            node {
              availableForSale
              id
              title
              price
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

const adminCollectionProductsQuery = `
  query collectionProducts($id: ID!, $first: Int, $metafieldNamespace: String) {
    collection(id: $id) {
      id
      title
      metafields(namespace: $metafieldNamespace, first: 5) {
        ...MetafieldFragment
      }
      products(first: $first) {
        ...AdmincProductFragment
      }
    }
  }
  ${adminPoductFragment}
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
      adminCollectionProductsQuery,
      variables
    )

    logger.info('Get admin collection product successfully')

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
