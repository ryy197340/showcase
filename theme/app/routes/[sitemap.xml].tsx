import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import groq from 'groq';
import invariant from 'tiny-invariant';

type SitemapPage = {
  _updatedAt: string;
  imageUrl: string;
  url: string;
};

type ShopifyCollection = {
  handle: string;
  onlineStoreUrl: string | null;
  updatedAt: string;
  image?: {
    url: string;
  } | null;
  seo?: {
    title?: string;
    description?: string;
  } | null;
};

type SanityPayload = {
  collections: SitemapPage[];
  home: SitemapPage;
  blogHome: SitemapPage;
  pages: SitemapPage[];
  products: SitemapPage[];
  blogPosts: SitemapPage[];
};

function filterPublishedCollections(
  collections: ShopifyCollection[],
): ShopifyCollection[] {
  return collections.filter((collection) => collection.onlineStoreUrl !== null);
}

function mapCollectionsForSitemap(
  collections: ShopifyCollection[],
  baseUrl: string,
): SitemapPage[] {
  return collections.map((collection) => ({
    _updatedAt: collection.updatedAt,
    imageUrl: collection.image?.url || '',
    url: `${baseUrl}/collections/${collection.handle}`,
  }));
}

export async function loader({
  request,
  context: {sanity, storefront},
}: LoaderFunctionArgs) {
  const baseUrl = new URL(request.url).origin;

  try {
    const allCollections: ShopifyCollection[] = [];
    let hasNextPage = true;
    let cursor: string | null = null;

    while (hasNextPage) {
      type QueryResult = {
        collections: {
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string;
          };
          nodes: ShopifyCollection[];
        };
      };

      const result: QueryResult = await storefront.query<QueryResult>(
        SHOPIFY_COLLECTIONS_QUERY,
        {variables: {cursor}},
      );

      const collections = result.collections?.nodes || [];
      allCollections.push(...collections);
      hasNextPage = result.collections?.pageInfo?.hasNextPage || false;
      cursor = result.collections?.pageInfo?.endCursor || null;
    }
    const publishedCollections = filterPublishedCollections(allCollections);
    const collectionsForSitemap = mapCollectionsForSitemap(
      publishedCollections,
      baseUrl,
    );

    const data = await sanity.client.fetch<Omit<SanityPayload, 'collections'>>(
      QUERY_SANITY,
      {
        baseUrl,
      },
    );

    invariant(data, 'Sitemap data is missing');
    const combinedData: SanityPayload = {
      ...data,
      collections: collectionsForSitemap,
    };

    return new Response(
      shopSitemap({data: combinedData, baseUrl: new URL(request.url).origin}),
      {
        headers: {
          'content-type': 'application/xml',
          // Cache for 24 hours
          'cache-control': `max-age=${60 * 60 * 24}`,
        },
      },
    );
  } catch (_) {
    const data = await sanity.client.fetch<Omit<SanityPayload, 'collections'>>(
      QUERY_SANITY,
      {
        baseUrl,
      },
    );

    const fallbackData: SanityPayload = {
      ...data,
      collections: [],
    };

    return new Response(shopSitemap({data: fallbackData, baseUrl}), {
      headers: {
        'content-type': 'application/xml',
        'cache-control': `max-age=${60 * 5}`,
      },
    });
  }
}

function shopSitemap({data, baseUrl}: {data: SanityPayload; baseUrl: string}) {
  const {collections, home, blogHome, pages, products, blogPosts} = data;

  const homePage = {
    changeFreq: 'daily',
    ...(home.imageUrl ? {image: {url: home.imageUrl}} : {}),
    lastMod: home._updatedAt,
    url: baseUrl,
  };

  const blogHomePage = {
    changeFreq: 'daily',
    ...(blogHome?.imageUrl ? {image: {url: blogHome.imageUrl}} : {}),
    lastMod: blogHome?._updatedAt,
    url: blogHome?.url || `${baseUrl}/blog`,
  };

  const blogCategoryPages = ['culture', 'lifestyle', 'style'].map((cat) => ({
    changeFreq: 'weekly',
    lastMod: blogHome?._updatedAt,
    url: `${baseUrl}/blog/${cat}`,
  }));

  const productPages = products.map((product) => {
    return {
      changeFreq: 'daily',
      ...(product.imageUrl ? {image: {url: product.imageUrl}} : {}),
      lastMod: product._updatedAt,
      url: product.url,
    };
  });

  const collectionPages = collections.map((collection) => {
    return {
      changeFreq: 'daily',
      ...(collection.imageUrl ? {image: {url: collection.imageUrl}} : {}),
      lastMod: collection._updatedAt,
      url: collection.url,
    };
  });

  const standardPages = pages.map((page) => {
    return {
      changeFreq: 'weekly',
      ...(page.imageUrl ? {image: {url: page.imageUrl}} : {}),
      lastMod: page._updatedAt,
      url: page.url,
    };
  });

  const blogPostPages = blogPosts.map((blogPost) => {
    return {
      changeFreq: 'weekly',
      ...(blogPost.imageUrl ? {image: {url: blogPost.imageUrl}} : {}),
      lastMod: blogPost._updatedAt,
      url: blogPost.url,
    };
  });

  const allPages = [
    homePage,
    blogHomePage,
    ...blogCategoryPages,
    ...productPages,
    ...collectionPages,
    ...standardPages,
    ...blogPostPages,
  ];

  return `
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    >
      ${allPages.map((page) => renderUrlTag(page)).join('')}
    </urlset>`;
}

function renderUrlTag({
  url,
  lastMod,
  changeFreq,
  image,
}: {
  url: string;
  lastMod?: string;
  changeFreq?: string;
  image?: {
    url: string;
    title?: string;
    caption?: string;
  };
}) {
  return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>${changeFreq}</changefreq>
      ${
        image
          ? `
        <image:image>
          <image:loc>${image.url}</image:loc>
          <image:title>${image.title ?? ''}</image:title>
          <image:caption>${image.caption ?? ''}</image:caption>
        </image:image>`
          : ''
      }

    </url>
  `;
}

const SHOPIFY_COLLECTIONS_QUERY = `
  query SitemapCollections($cursor: String) {
    collections(first: 250, after: $cursor, sortKey: UPDATED_AT) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        onlineStoreUrl
        updatedAt
        image {
          url
        }
        seo {
          title
          description
        }
      }
    }
  }
` as const;

const QUERY_SANITY = groq`
{
  "home": *[
    _type == 'home'
  ][0] {
    _updatedAt,
    "imageUrl": coalesce(seo.image.asset->url, store.imageUrl),
  },
  "blogHome": *[
    _type == 'blogHome'
  ][0] {
    _updatedAt,
    "imageUrl": seo.image.asset->url,
    "url": $baseUrl + "/blog",
  },
  "pages": *[
    _type == 'page'
  ] {
    _updatedAt,
    "imageUrl": seo.image.asset->url,
    "url": $baseUrl + "/pages/" + slug.current,
  },
  "products": *[
    _type == 'product'
    && store.status == 'active'
  ] {
    _updatedAt,
    "imageUrl": coalesce(seo.image.asset->url, store.previewImageUrl),
    "url": $baseUrl + "/products/" + store.slug.current,
  },
  "blogPosts": *[
    _type == 'blogPost'
  ] {
    _updatedAt,
    "imageUrl": seo.image.asset->url,
    "url": $baseUrl + "/blog/" + category + "/" + slug.current,
  },
}
`;
