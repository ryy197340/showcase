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
    const { email, dob } = request.body

    const encodedParams = new URLSearchParams()
    encodedParams.set('dob', dob)

    const response = await fetch(
      `${process.env.RIVO_API_URL}/customers/${encodeURIComponent(email)}`,
      {
        method: 'POST',
        body: encodedParams,
        headers: getRivoHeadersWithFormData(),
      }
    )

    const result = await response.json()

    logger.info('Update customer birthday successfully')

    await reply.type('application/json').send(result)
  }
)

route.options = createAuthenticatedSchema({
  email: { type: 'string' },
  dob: { type: 'string' },
})

export default route
