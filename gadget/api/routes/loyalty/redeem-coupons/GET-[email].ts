import { getRivoHeaders } from '../../../utils/rivo'
import type { RouteHandler } from 'gadget-server'

const route: RouteHandler<{ Params: { email: string } }> = async ({
  request,
  reply,
}) => {
  const email = request.params.email

  const response = await fetch(
    `${
      process.env.RIVO_API_URL
    }/points_redemptions?filters[customer_identifier]=${encodeURIComponent(
      email
    )}`,
    { headers: getRivoHeaders() }
  )

  const result = await response.json()

  await reply.type('application/json').send(result)
}

export default route
