import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(async ({ request, reply, logger }) => {
  const { query, variables } = request.body
  const endpointUrl = process.env.SKIO_GRAPHQL_ENDPOINT ?? ''

  const requestBody = {
    query,
    variables,
  }

  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `API ${process.env.SKIO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    throw new Error(
      `Skio API request failed: ${response.status} ${response.statusText}`
    )
  }

  const responseData = await response.json()
  logger.info('Skio API response: \n', responseData)
  await reply.type('application/json').send({ responseData })
})

route.options = createAuthenticatedSchema({
  query: { type: 'string' },
  variables: { type: 'object' },
})

export default route
