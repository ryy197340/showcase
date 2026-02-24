import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'
import { getShopifyClient } from '../../utils/shopify'

const orderProductVariantFragment = `
  fragment OrderProductVariant on ProductVariant {
    id
    title
    product {
      id
      title
      images(first: 1) {
        edges {
          node {
            id
            url
            transformedSrc(maxWidth: 200, maxHeight: 200)
          }
        }
      }
    }
  }
`

const orderConnectionFragment = `
  fragment OrderConnectionFragment on OrderConnection {
    edges {
      cursor
      node {
        id
        currentTotalPrice {
          amount
          currencyCode
        }
        canceledAt
        orderNumber
        customerUrl
        fulfillmentStatus
        name
        statusUrl
        processedAt
        successfulFulfillments(first: 5) {
          trackingCompany
          trackingInfo(first: 5) {
            number
            url
          }
        }
        lineItems(first: 100) {
          edges {
            node {
              title
              quantity
              variant {
                ...OrderProductVariant
              }
              discountedTotalPrice {
                amount
                currencyCode
              }
              originalTotalPrice {
                amount
                currencyCode
              }
              customAttributes {
                key
                value
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
  ${orderProductVariantFragment}
`

const customerOrdersWithCursorQuery = `
  query customer($customerAccessToken: String!, $after: String, $first: Int) {
    customer(customerAccessToken: $customerAccessToken) {
      orders(
        first: $first
        after: $after
        sortKey: PROCESSED_AT
        reverse: true
      ) {
        ...OrderConnectionFragment
      }
    }
  }
  ${orderConnectionFragment}
`

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { customerAccessToken, first, after } = request.body

    const variables = {
      customerAccessToken, first, after,
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(
      customerOrdersWithCursorQuery,
      variables
    )

    logger.info('Get customer orders with cursor successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  customerAccessToken: { type: 'string' },
  first: { type: 'number' },
  after: { type: 'string' },
})

export default route
