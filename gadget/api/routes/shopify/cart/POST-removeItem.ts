import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../../middleware/appCheckAuth'
import { getShopifyClient } from '../../../utils/shopify'

const cartFragment = `
  fragment CartFragment on Cart {
    id
    createdAt
    updatedAt
    checkoutUrl
    lines(first: 30) {
      edges {
        node {
          id
          quantity
          attributes {
            key
            value
          }
          estimatedCost {
            totalAmount {
              amount
              currencyCode
            }
          }
          sellingPlanAllocation {
            sellingPlan {
              id
              name
            }
          }
          merchandise {
            ... on ProductVariant {
              id
              title
              product {
                id
                title
                description
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
          }
        }
      }
    }
    estimatedCost {
      totalAmount {
        amount
        currencyCode
      }
      subtotalAmount {
        amount
        currencyCode
      }
      totalTaxAmount {
        amount
        currencyCode
      }
      totalDutyAmount {
        amount
        currencyCode
      }
    }
    checkoutUrl
    buyerIdentity {
      email
      phone
      countryCode
      customer {
        id
      }
    }
  }
`

const cartLinesRemoveMutation = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFragment
      }
    }
  }
  ${cartFragment}
`
/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { cartId, lineIds } = request.body

    const variables = {
      cartId,
      lineIds,
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(
      cartLinesRemoveMutation,
      variables
    )

    logger.info('Cart item removed successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  cartId: { type: 'string' },
  lineIds: { type: 'array' },
})

export default route
