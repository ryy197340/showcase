import { getRivoHeadersWithFormData } from '../../utils/rivo'
import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { customer_identifier, reward_id, points_amount } = request.body

    const encodedParams = new URLSearchParams()
    encodedParams.set('customer_identifier', customer_identifier)
    encodedParams.set('reward_id', reward_id)
    encodedParams.set('points_amount', points_amount)

    const response = await fetch(
      `${process.env.RIVO_API_URL}/points_redemptions`,
      {
        method: 'POST',
        body: encodedParams,
        headers: getRivoHeadersWithFormData(),
      }
    )

    const result = await response.json()

    logger.info('Creating checkout successfully')

    await reply.type('application/json').send(result)
  }
)

route.options = createAuthenticatedSchema({
  customer_identifier: { type: 'string' },
  reward_id: { type: 'string' },
  points_amount: { type: 'string' },
})

export default route
