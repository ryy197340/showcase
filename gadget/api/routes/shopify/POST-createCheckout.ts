import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'
import { getShopifyClient } from '../../utils/shopify'

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

const createCartMutation = `
  mutation cartCreate($cartInput: CartInput, $countryISO: CountryCode)
  @inContext(country: $countryISO) {
    cartCreate(input: $cartInput) {
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
    const { cartInput } = request.body

    const variables = {
      cartInput,
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(
      createCartMutation,
      variables
    )

    logger.info('Creating checkout successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  cartInput: { type: 'object' },
})

export default route
