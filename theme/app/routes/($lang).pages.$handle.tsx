import {Await, useLoaderData, useMatches} from '@remix-run/react';
import type {SeoHandleFunction} from '@shopify/hydrogen';
import {defer, type LoaderFunctionArgs, redirect} from '@shopify/remix-oxygen';
import clsx from 'clsx';
import {Suspense} from 'react';
import invariant from 'tiny-invariant';

import DecorativeBreadcrumbs from '~/components/heroes/DecorativeBreadcrumbs';
import PageHero from '~/components/heroes/Page';
import ModuleGrid from '~/components/modules/ModuleGrid';
import GiftCardBalanceChecker from '~/components/page/GiftCardBalanceChecker';
import HelpSideBar from '~/components/page/HelpSideBar';
import PortableText from '~/components/portableText/PortableText';
import type {HelpNav, SanityPage} from '~/lib/sanity';
import {ColorTheme} from '~/lib/theme';
import {
  fetchGids,
  notFound,
  SIDEBAR_CLASSNAMES,
  validateLocale,
} from '~/lib/utils';
import {PAGE_QUERY} from '~/queries/sanity/page';

const seo: SeoHandleFunction<typeof loader> = ({data}) => ({
  title: data?.page?.seo?.title,
  description:
    data?.page?.seo?.description && data?.page?.seo?.description.length > 155
      ? `${data?.page?.seo?.description.substring(0, 151)}...`
      : data?.page?.seo?.description,
  media: data?.page?.seo?.image,
});

export const handle = {
  seo,
};

export async function loader({params, context, request}: LoaderFunctionArgs) {
  const {handle} = params;
  if (params.lang && handle?.includes('store-locator')) {
    return redirect(
      new URL(request.url).pathname.replace(`/${params.lang}`, ''),
      {
        status: 301,
        headers: {
          'X-Robots-Tag': 'noindex',
        },
      },
    );
  }
  validateLocale({context, params});
  invariant(handle, 'Missing page handle');

  const cache = context.storefront.CacheCustom({
    mode: 'public',
    maxAge: 60,
    staleWhileRevalidate: 60,
  });

  let page;
  try {
    ({data: page} = await context.sanity.loadQuery<SanityPage>(
      PAGE_QUERY,
      {handle},
      {
        cache,
        hydrogen: {
          tag: 'page',
        },
      },
    ));
  } catch (error) {
    console.error(error);
  }

  if (!page) {
    throw notFound();
  }

  const desiredModuleType = 'module.featuredProductsGrid';
  const featuredProductsGridModule = page.modules?.find(
    (module) => module._type === desiredModuleType,
  );

  let products;
  if (featuredProductsGridModule) {
    try {
      products = await Promise.all(
        featuredProductsGridModule.product.map(async function (product) {
          const query = `*[ _type == "product" && _id == "${product._ref}" ]`;
          const {data: productData} = await context.sanity.loadQuery(
            query,
            undefined,
            {
              hydrogen: {
                tag: 'product',
              },
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

  // Resolve any references to products on the Storefront API
  const gids = fetchGids({page, context});

  return defer({
    products,
    page,
    gids,
    storeDomain: context.storefront.getShopifyDomain(),
  });
}

export default function Page() {
  const {page, gids, storeDomain} = useLoaderData<typeof loader>();
  const [root] = useMatches();
  const handle = root.params.handle;
  const helpNav: HelpNav = root.data?.layout.helpNav;
  const isHelpPage = helpNav?.find(
    (p) => p._type === 'linkInternal' && handle && p.slug?.includes(handle),
  );
  const slug =
    isHelpPage && isHelpPage._type === 'linkInternal'
      ? isHelpPage?.slug
      : undefined;
  const isGcCheckerPage = handle === 'check-your-gift-card-balance';

  const bodyContent = (
    <>
      <PageHero fallbackTitle={page.title} hero={page.hero} />
      {/* Body */}
      {page.body &&
        page.body !== null &&
        page.body[0].children[0].text !== '' && (
          <PortableText
            blocks={page.body}
            centered
            className={clsx(
              'body-content mx-auto px-4 pb-24 pt-0', //
              'md:px-8',
              handle === 'faqs' ? 'max-w-[660px]' : 'page-width',
            )}
          />
        )}
      {isGcCheckerPage && <GiftCardBalanceChecker storeDomain={storeDomain} />}
      {page?.modules && (
        <div className={clsx('pages-handle-modules overflow-hidden')}>
          <ModuleGrid items={page.modules} />
        </div>
      )}
    </>
  );

  return (
    <ColorTheme value={page.colorTheme}>
      <Suspense>
        <Await resolve={gids}>
          {page.showBreadcrumbs && (
            <DecorativeBreadcrumbs
              title={
                typeof page.hero?.title === 'string'
                  ? page.hero.title
                  : page.title
                  ? page.title
                  : undefined
              }
            />
          )}
          {!page.hero && (
            <div
              className={clsx(
                'mx-auto max-w-[60rem] px-4 py-[30px] md:pb-[50px]',
                'md:px-8',
              )}
            >
              <h1
                className={clsx(
                  `text-center font-hoefler text-[34px] ${
                    page.title === 'Email Preferences' ? 'hidden' : ''
                  }`,
                  'md:px-8',
                )}
              >
                {page.title}
              </h1>
            </div>
          )}
          {page.hero && page.hero.title && (
            <div className="flex justify-center py-12 font-hoefler text-primary">
              <h1
                className={clsx(
                  'whitespace-pre-line text-center text-2xl',
                  'md:text-[34px]',
                )}
                style={{color: page.colorTheme?.text || '#13294E'}}
              >
                {page.hero.title}
              </h1>
            </div>
          )}
          {isHelpPage && (
            <div className={SIDEBAR_CLASSNAMES}>
              <HelpSideBar helpNav={helpNav} />
              <div className="body-content-sidebar">{bodyContent}</div>
            </div>
          )}
          {!isHelpPage && bodyContent}
        </Await>
      </Suspense>
    </ColorTheme>
  );
}
