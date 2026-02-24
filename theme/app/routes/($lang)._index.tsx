import {Await, useLoaderData} from '@remix-run/react';
import {AnalyticsPageType, type SeoHandleFunction} from '@shopify/hydrogen';
import {defer, type LoaderFunctionArgs} from '@shopify/remix-oxygen';
import clsx from 'clsx';
import {Suspense, useEffect, useState} from 'react';

import HomeHero from '~/components/heroes/Home';
import ModuleGrid from '~/components/modules/ModuleGrid';
import {useHydration} from '~/hooks/useHydration';
import type {SanityBlogPostPage, SanityHomePage} from '~/lib/sanity';
import {fetchGids, notFound, validateLocale} from '~/lib/utils';
import {HP_FEATURED_BLOG_POSTS} from '~/queries/sanity/fragments/modules/featuredBlogPosts';
import {HOME_PAGE_QUERY} from '~/queries/sanity/home';

const seo: SeoHandleFunction = ({data}) => ({
  title: data?.page?.seo?.title || 'J. McLaughlin',
  description:
    data?.page?.seo?.description ||
    "J.McLaughlin is a destination for defining style. Our collection of women's and men's clothing and accessories reflects our casual, classic style peppered with a dose of wit.",
});
export const handle = {
  seo,
};

export async function loader({context, params}: LoaderFunctionArgs) {
  const {sanity} = context;
  validateLocale({context, params});
  const cache = context.storefront.CacheCustom({
    mode: 'public',
    maxAge: 60,
    staleWhileRevalidate: 60,
  });

  const {data: page} = await sanity.loadQuery<SanityHomePage>(
    HOME_PAGE_QUERY,
    undefined,
    {
      hydrogen: {},
      tag: 'home-page',
    },
  );

  if (!page) {
    throw notFound();
  }

  const {data: blogPosts} = await sanity.loadQuery<[]>(
    HP_FEATURED_BLOG_POSTS,
    undefined,
    {
      hydrogen: {},
      tag: 'home-page-blog-posts',
    },
  );
  const desiredModuleType = 'module.featuredBlogPosts';
  const desiredModuleType2 = 'module.featuredProductsGrid';
  const featuredBlogPostsModule = page.modules.find(
    (module) => module._type === desiredModuleType,
  );
  const featuredProductsGridModule = page.modules.find(
    (module) => module._type === desiredModuleType2,
  );

  let products;

  if (featuredProductsGridModule) {
    try {
      products = await Promise.all(
        featuredProductsGridModule.product.map(async function (product) {
          const queryOptionsProduct = {
            query: `*[ _type == "product" && _id == "${product._ref}" ]`,
          };

          const {data: productData} = await sanity.loadQuery<[]>(
            queryOptionsProduct,
            undefined,
            {
              hydrogen: {},
              tag: 'home-page-products',
            },
          );

          if (!featuredProductsGridModule.products) {
            featuredProductsGridModule.products = [];
          }
          featuredProductsGridModule.products.push(productData);
          return productData;
        }),
      );
    } catch (error) {
      console.error('error', error);
    }
  }

  if (featuredBlogPostsModule) {
    featuredBlogPostsModule.blogPosts = blogPosts;
  }

  // Resolve any references to products on the Storefront API
  const gids = fetchGids({page, context});

  return defer({
    products,
    page,
    blogPosts,
    gids,
    analytics: {
      pageType: AnalyticsPageType.home,
    },
  });
}

function IndexSSR() {
  const {page} = useLoaderData<typeof loader>();

  return (
    <div>
      {page?.hero && <HomeHero hero={page.hero} />}

      {page?.modules && (
        <div className="home mb-15 overflow-hidden px-5 md:mb-22 md:px-10">
          <ModuleGrid items={page.modules} />
        </div>
      )}
    </div>
  );
}

function IndexCSR() {
  const {page, gids} = useLoaderData<typeof loader>();

  return (
    <Suspense>
      <Await resolve={gids}>
        <div>
          {/* Page hero */}
          {page?.hero && (
            <HomeHero hero={page.hero} fullWidth={page?.fullWidth} />
          )}

          {page?.modules && (
            <div
              className={clsx(
                'home mb-15 overflow-hidden md:mb-22',
                page?.fullWidth ? 'px-0' : 'px-5 md:px-10',
              )}
            >
              <ModuleGrid items={page.modules} />
            </div>
          )}
        </div>
      </Await>
    </Suspense>
  );
}

export default function Index(props: any) {
  return <IndexCSR {...props} />;
}
