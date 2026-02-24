import { getRivoHeaders } from '../../utils/rivo'
import type { RouteHandler } from 'gadget-server'

const route: RouteHandler<{}> = async ({ request, reply }) => {
  const response = await fetch(`${process.env.RIVO_API_URL}/rewards`, {
    headers: getRivoHeaders(),
  })

  const result = await response.json()

  await reply.type('application/json').send(result)
}

export default route
