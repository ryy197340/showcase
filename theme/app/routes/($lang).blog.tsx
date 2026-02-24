import type {ShouldRevalidateFunction} from '@remix-run/react';
import {useLoaderData, useLocation} from '@remix-run/react';
import {
  defer,
  json,
  LinksFunction,
  type LoaderFunctionArgs,
  redirect,
} from '@shopify/remix-oxygen';
import clsx from 'clsx';
import {Suspense, useState} from 'react';
import {useParams} from 'react-router-dom'; // Make sure to import the necessary components

import BlogBreadcrumb from '~/components/blog/BlogBreadcrumb';
import BlogCard from '~/components/blog/BlogCard';
import BlogIndividual from '~/components/blog/BlogIndividual';
import BlogSidebar from '~/components/blog/BlogSidebar';
import LocalizedA from '~/components/global/LocalizedA';
import {FacetCaret} from '~/components/icons/FacetCaret';
import {Link} from '~/components/Link';
import {BlogPost, SanityBlogPostPage} from '~/lib/sanity';
import {validateLocale} from '~/lib/utils';
import {BLOG_PAGE_QUERY, BLOG_SIDEBAR_QUERY} from '~/queries/sanity/blog';
import {BLOG_PAGE_ALL_CATEGORY_QUERY} from '~/queries/sanity/blogAllCategory';
import {BLOG_PAGE_CATEGORY_QUERY} from '~/queries/sanity/blogCategory';
import {BLOG_PAGE_POST_QUERY} from '~/queries/sanity/blogSingle';
import {BLOG_POST} from '~/queries/sanity/fragments/pages/blogPost';
import stylesheet from '~/styles/blog.css';
const ITEMS_PER_PAGE = 8;

export const links: LinksFunction = () => {
  return [{rel: 'stylesheet', href: stylesheet}];
};

export async function loader({params, context, request}: LoaderFunctionArgs) {
  if (params.lang) {
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
  const {handle} = params;
  const urlSearchParams = new URLSearchParams(request.url.split('?')[1]); // Parse the URL to get the query parameters
  const page = urlSearchParams.get('page') || '1';
  const currentPage = parseInt(page, 10);
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const cache = context.storefront.CacheNone();

  /* get all blog posts for sidebar */
  try {
    let sidebarBlogPosts;

    try {
      ({data: sidebarBlogPosts} =
        await context.sanity.loadQuery<SanityBlogPostPage>(
          BLOG_SIDEBAR_QUERY,
          undefined,
          {
            hydrogen: {
              tag: 'blog-page',
            },
          },
        ));
    } catch (error) {
      console.error('error', error);
    }
    if (!sidebarBlogPosts) {
      return json(
        {error: 'Could not find blog category or posts for this category'},
        {status: 404},
      );
    }
    /* end sideBarBlogPosts */
    // let blogPosts;
    if (handle !== undefined && handle.match(/^\d{2}-\d{4}$/)) {
      // this condition searches for sidebar monthly blog posts
      const [month, year] = handle.split('-');

      const startDate = `${year}-${month}-01T00:00:00Z`;
      const endDate = `${year}-${month}-31T23:59:59Z`;

      const query = `*[_type == "blogPost" && date >= '${startDate}' && date <= '${endDate}']{
        ...,
        "featuredImage": {
          "url": featuredImage.asset->url
        },
      }`;

      let blogPosts;
      try {
        ({data: blogPosts} = await context.sanity.loadQuery<SanityBlogPostPage>(
          query,
          undefined,
          {
            hydrogen: {
              tag: 'blog-post-monthly',
            },
          },
        ));
      } catch (error) {
        console.error('error', error);
      }

      if (!blogPosts) {
        return json(
          {error: 'Could not find blog posts for the specified month and year'},
          {status: 404},
        );
      }

      return defer({
        blogPosts,
        sidebarBlogPosts,
      });
    }
    // end monthly posts request

    if (handle === undefined) {
      // undefined means you're on /blog -- get all posts

      const query = `*[_type == 'blogPost'] | order(date desc) [${start}...${
        start + ITEMS_PER_PAGE
      }]{${BLOG_POST}}`;

      let blogPosts;

      try {
        ({data: blogPosts} = await context.sanity.loadQuery<SanityBlogPostPage>(
          query,
          undefined,
          {
            hydrogen: {
              tag: 'blog-post',
            },
          },
        ));
      } catch (error) {
        console.error('error', error);
      }

      if (!blogPosts) {
        return json(
          {error: 'Could not find blog category or posts for this category'},
          {status: 404},
        );
      }

      return defer({
        blogPosts,
        sidebarBlogPosts,
      });
    } else if (
      handle !== 'style' &&
      handle !== 'culture' &&
      handle !== 'lifestyle'
    ) {
      // individual posts
      let blogPosts;
      try {
        ({data: blogPosts} = await context.sanity.loadQuery<BlogPost[]>(
          BLOG_PAGE_POST_QUERY,
          {handle},
          {
            hydrogen: {
              tag: 'blog-post',
            },
          },
        ));
      } catch (error) {
        console.error('error', error);
      }
      // take the product references and use their _ref to get the products from sanity
      let products;
      // let tag;
      if (!blogPosts || blogPosts.length === 0) {
        return json({error: 'Could not find blog post'}, {status: 404});
      }
      if (blogPosts && blogPosts[0] && Array.isArray(blogPosts[0].modules)) {
        for (const module of blogPosts[0].modules) {
          if (module._type === 'module.featuredProductsGrid') {
            try {
              products = await Promise.all(
                module.product.map(async function (product) {
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
                  if (!module.products) {
                    module.products = [];
                  }
                  module.products.push(productData);
                  return productData;
                }),
              );
            } catch (error) {
              console.error('error', error);
            }
          }
        }
      }
      // end problem
      return defer({
        blogPosts,
        sidebarBlogPosts,
        products,
      });
    } else {
      // Handle category requests

      const {data: blogPosts} =
        await context.sanity.loadQuery<SanityBlogPostPage>(
          BLOG_PAGE_CATEGORY_QUERY,
          {handle, start, end: start + ITEMS_PER_PAGE},
          {
            hydrogen: {
              tag: 'blog-post-category',
            },
          },
        );

      const {data: allCategoryPosts} =
        await context.sanity.loadQuery<SanityBlogPostPage>(
          BLOG_PAGE_ALL_CATEGORY_QUERY,
          {handle},
          {
            hydrogen: {
              tag: 'blog-post-all-category',
            },
          },
        );

      if (!blogPosts) {
        return json(
          {error: 'Could not find blog category or posts for this category'},
          {status: 404},
        );
      }

      return defer({
        blogPosts,
        sidebarBlogPosts,
        allCategoryPosts,
      });
    }
  } catch (error) {
    console.error(error);
    return json(
      {error: 'Could not find blog category or posts'},
      {status: 404},
    );
  }
}

export function shouldRevalidate({
  nextUrl,
  defaultShouldRevalidate,
}: {
  nextUrl: URL;
  defaultShouldRevalidate: ShouldRevalidateFunction;
}) {
  // Ensure the loader runs when navigating to the /blog route
  if (nextUrl.pathname === '/blog') {
    return true;
  }

  // Use the default behavior for other routes
  return defaultShouldRevalidate;
}

// Create a context for blog filters
//export const BlogFiltersContext = createContext<any>({});

const BLOG_CLASSES = 'blog-breadcrumb flex flex-row gap-5 text-2xs';
const BREADCRUMB_CLASSES = 'border-r border-lineGray pr-4';

// Define the Blog component for the blog route
export default function Blog() {
  const data = useLoaderData<typeof loader>();
  const handle = useParams();
  const location = useLocation();
  const {blogPosts, sidebarBlogPosts, allCategoryPosts} = data || {};
  const isCategoryPage = ['style', 'culture', 'lifestyle'].includes(
    handle.handle,
  );
  const isBlogPostPage =
    location.pathname.includes('/blog/style/') ||
    location.pathname.includes('/blog/culture/') ||
    (location.pathname.includes('/blog/lifestyle/') &&
      !location.search.includes('page='));
  const [currentPage, setCurrentPage] = useState(
    parseInt(location.search.split('page=')[1]) || 1,
  );

  const totalPages = Math.ceil(
    allCategoryPosts && isCategoryPage
      ? allCategoryPosts?.length / ITEMS_PER_PAGE
      : sidebarBlogPosts?.length / ITEMS_PER_PAGE,
  );
  const pageNumbers = [];

  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const MAX_DISPLAY_PAGES = 5;

  const handlePrevious = () => {
    const newPage = Math.max(1, currentPage - MAX_DISPLAY_PAGES);
    // Update the currentPage to reflect the new value
    setCurrentPage(newPage);
  };

  const handleNext = () => {
    const newPage = Math.min(totalPages, currentPage + MAX_DISPLAY_PAGES);
    // Update the currentPage to reflect the new value
    setCurrentPage(newPage);
  };

  const getDisplayedPages = () => {
    const displayedPages = [];
    let startPage = currentPage || 1;
    if (currentPage > MAX_DISPLAY_PAGES) {
      startPage = currentPage;
    }

    if (currentPage >= totalPages - MAX_DISPLAY_PAGES + 1) {
      startPage = Math.max(1, totalPages - MAX_DISPLAY_PAGES + 1);
    }

    for (
      let i = startPage;
      i < Math.min(startPage + MAX_DISPLAY_PAGES, totalPages + 1);
      i++
    ) {
      displayedPages.push(i);
    }
    return displayedPages;
  };

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {data && (
        <div className="page-width flex flex-col px-4 text-primary md:flex-row md:gap-10 md:px-10 lg:gap-[70px] lg:px-[120px]">
          <div className="hidden w-1/5 lg:flex">
            <BlogSidebar sidebarBlogPosts={sidebarBlogPosts} />
          </div>
          <div className="flex w-full flex-col pt-10 lg:w-4/5 lg:px-0 lg:py-10">
            {isBlogPostPage ? (
              <div className="flex flex-col items-center gap-8 px-4 lg:px-8">
                <div className={BLOG_CLASSES}>
                  <LocalizedA href="/" className={BREADCRUMB_CLASSES}>
                    Home
                  </LocalizedA>
                  <LocalizedA href="/blog">Blog</LocalizedA>
                </div>
                {(blogPosts?.length > 0 && (
                  <h1 className="self-center text-center font-hoefler text-xl2">
                    {blogPosts[0].title}
                  </h1>
                )) ??
                  blogPosts[0].title}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className={BLOG_CLASSES}>
                  <LocalizedA href="/" className={BREADCRUMB_CLASSES}>
                    Home
                  </LocalizedA>
                  <LocalizedA href="/blog">Blog</LocalizedA>
                </div>
                <h1 className="self-center py-5 font-hoefler text-xl2 text-primary">
                  The J.McL Life -{' '}
                  <i className="block text-center md:inline">Our Blog</i>
                </h1>
                <BlogBreadcrumb />
              </div>
            )}
            {!isBlogPostPage ? (
              <div>
                <BlogCard
                  blogPosts={blogPosts}
                  isProductGrid={false}
                  isBlogGrid={true}
                  isBlogModule={true}
                />
                <div className="flex justify-center gap-[10px] py-15">
                  {currentPage > 1 && (
                    <button onClick={handlePrevious}>
                      <FacetCaret direction="left" />
                    </button>
                  )}
                  {getDisplayedPages().map((number) => {
                    return (
                      <LocalizedA
                        href={`${location.pathname}?page=${number}`}
                        key={number}
                        className={clsx(
                          'flex h-[50px] w-[54px] items-center justify-center  border border-lineGray text-xs text-primary',
                          currentPage === number && 'border-primary ',
                        )}
                      >
                        {number}
                      </LocalizedA>
                    );
                  })}
                  {totalPages > MAX_DISPLAY_PAGES &&
                    currentPage < totalPages - MAX_DISPLAY_PAGES + 1 && (
                      <Link
                        to={`${location.pathname}?page=${totalPages}`}
                        className="flex h-[50px] w-[54px] items-center justify-center  border border-lineGray text-primary"
                      >
                        {totalPages}
                      </Link>
                    )}
                  {currentPage < totalPages &&
                    currentPage < totalPages - MAX_DISPLAY_PAGES + 1 && (
                      <button onClick={handleNext}>
                        <FacetCaret direction="right" />
                      </button>
                    )}
                </div>
              </div>
            ) : (
              <BlogIndividual blogPosts={blogPosts} />
            )}
          </div>
          <div className="flex w-full justify-center md:hidden">
            <BlogSidebar sidebarBlogPosts={sidebarBlogPosts} />
          </div>
        </div>
      )}
    </Suspense>
  );
}
