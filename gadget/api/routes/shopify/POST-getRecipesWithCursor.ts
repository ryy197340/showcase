import {
  withAppCheckAuth,
  createAuthenticatedSchema,
} from '../../middleware/appCheckAuth'
import { getShopifyClient } from '../../utils/shopify'

const articleFragment = `
  fragment AllArticleFragment on ArticleConnection {
    edges {
      cursor
      node {
        id
        title
        handle
        image {
          url
        }
      }
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
    }
  }
`

const productsWithCursorQuery = `
  query blogs($cursor: String) {
    blog(after: $cursor, handle: "cocktail-recipes") {
      id
      articles(first: 100) {
        ...AllArticleFragment
      }
    }
  }
  ${articleFragment}
`

/**
 * Route handler for secure Skio GraphQL proxy with Firebase App Check
 *
 * See: https://docs.gadget.dev/guides/http-routes/route-configuration#route-context
 */
const route = withAppCheckAuth(
  async ({ request, reply, api, logger, connections }) => {
    const { first, after } = request.body

    const variables = {
      first,
      after,
    }

    const shopifyClient = await getShopifyClient()
    if (!shopifyClient) {
      logger.error('No Shopify connection available')
      return await reply
        .code(500)
        .send({ error: 'Shopify connection not available' })
    }

    const responseData = await shopifyClient.request(
      productsWithCursorQuery,
      variables
    )

    logger.info('Get recipes with cursor successfully')

    await reply.type('application/json').send(responseData)
  }
)

route.options = createAuthenticatedSchema({
  first: { type: 'number' },
  after: { type: 'string' },
})

export default route
