import { RouteHandler } from 'gadget-server'
import { verifyAppCheckToken, APP_CHECK_ERRORS } from '../utils/firebase'

export interface AuthenticatedRequest {
  body: any & { appCheckToken: string }
  isAuthenticated: true
}

export interface AuthenticationError {
  status: number
  body: { error: string; code: string }
}

/**
 * Higher-order function that wraps route handlers with App Check authentication
 */
export const withAppCheckAuth = <T extends Record<string, any>>(
  handler: (context: {
    request: AuthenticatedRequest
    reply: any
    api: any
    logger: any
    connections: any
  }) => Promise<void>
): RouteHandler => {
  return async ({ request, reply, api, logger, connections }) => {
    try {
      if (!process.env.SKIP_APP_CHECK) {
        const appCheckToken = request.headers?.['app-check-token'] as string

        const verification = await verifyAppCheckToken(appCheckToken)

        if (!verification.isValid) {
          const errorResponse =
            verification.code === 'MISSING_APP_CHECK_TOKEN'
              ? APP_CHECK_ERRORS.MISSING_TOKEN
              : APP_CHECK_ERRORS.INVALID_TOKEN

          return reply
            .status(errorResponse.status)
            .type('application/json')
            .send(errorResponse.body)
        }
      }

      // Token is valid, call the original handler
      const authenticatedRequest: AuthenticatedRequest = {
        ...request,
        body: request.body,
        isAuthenticated: true,
      }

      await handler({
        request: authenticatedRequest,
        reply,
        api,
        logger,
        connections,
      })
    } catch (error) {
      console.error('Authentication middleware error:', error)
      return reply
        .status(APP_CHECK_ERRORS.INTERNAL_ERROR.status)
        .type('application/json')
        .send(APP_CHECK_ERRORS.INTERNAL_ERROR.body)
    }
  }
}

/**
 * Standard schema for routes that require App Check authentication
 */
export const createAuthenticatedSchema = (
  additionalProperties: Record<string, any> = {}
) => ({
  schema: {
    headers: {
      type: 'object',
      properties: {
        'app-check-token': { type: 'string' },
      },
      required: ['app-check-token'],
    },
    body: {
      type: 'object',
      properties: {
        ...additionalProperties,
      },
      required: Object.keys(additionalProperties).filter(
        (key) => additionalProperties[key].required !== false
      ),
    },
  },
})
