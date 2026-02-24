import {type LoaderFunctionArgs} from '@shopify/remix-oxygen';

export const loader = ({request}: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  return new Response(robotsTxtData({url: url.origin}), {
    status: 200,
    headers: {
      'content-type': 'text/plain',
      // Cache for 24 hours
      'cache-control': `max-age=${60 * 60 * 24}`,
    },
  });
};

function robotsTxtData({url}: {url: string}) {
  const sitemapUrl = url ? `${url}/sitemap.xml` : undefined;

  return `
# Crawlers Setup
User-agent: *
Crawl-delay: 1

# Allowable Index
Allow: /sitemap.xml

# Paths
Disallow: /admin
Disallow: /cart
Disallow: /orders
Disallow: /checkouts/
Disallow: /checkout
Disallow: /carts
Disallow: /account
Disallow: /style-guide
Disallow: /contact-us
Disallow: /account/login
Disallow: /account/recover
Disallow: /account/register
Disallow: /pages/request-a-catalog
Disallow: /pages/unsubscribe
Disallow: /pages/email-preferences

# Google adsbot ignores robots.txt unless specifically named!
User-agent: adsbot-google
Disallow: /admin
Disallow: /cart
Disallow: /orders
Disallow: /checkouts/
Disallow: /checkout
Disallow: /carts
Disallow: /account
Disallow: /style-guide
Disallow: /contact-us
Disallow: /account/login
Disallow: /account/recover
Disallow: /account/register
Disallow: /pages/request-a-catalog
Disallow: /pages/unsubscribe
Disallow: /pages/email-preferences

${sitemapUrl ? `Sitemap: ${sitemapUrl}` : ''}
`.trim();
}
