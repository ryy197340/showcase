import {Await, useLoaderData} from '@remix-run/react';
import type {SeoHandleFunction} from '@shopify/hydrogen';
import {
  defer,
  json,
  type LoaderFunctionArgs,
  redirect,
} from '@shopify/remix-oxygen';
import {Suspense, useEffect} from 'react';

import BlogBreadcrumb from '~/components/blog/BlogBreadcrumb';
import BlogIndividual from '~/components/blog/BlogIndividual';
import BlogSidebar from '~/components/blog/BlogSidebar';
import {SanityBlogPostPage} from '~/lib/sanity';
import {BLOG_PAGE_POST_QUERY} from '~/queries/sanity/blogSingle';

const seo: SeoHandleFunction<typeof loader> = ({data}) => ({
  title: data?.blogPosts[0]?.seo?.title,
  description: data?.blogPosts[0]?.seo?.description,
  media: data?.blogPosts[0]?.seo?.image,
});

export const handle = {
  seo,
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
  const {handle} = params;
  const urlSearchParams = new URLSearchParams(request.url.split('?')[1]); // Parse the URL to get the query parameters
  const page = urlSearchParams.get('page') || '1';
  if (handle !== 'style' && handle !== 'culture' && handle !== 'lifestyle') {
    // Handle single blog posts
    try {
      const {data: blogPosts} =
        await context.sanity.loadQuery<SanityBlogPostPage>(
          BLOG_PAGE_POST_QUERY,
          {handle},
          {
            hydrogen: {
              tag: 'blog-post',
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
      });
    } catch (error) {
      console.error('Error fetching blog data: ', error);
    }
  }
}
export default function BlogPost() {
  const data = useLoaderData<typeof loader>();
  // Component logic for individual blog posts...
  const {blogPosts, sidebarBlogPosts} = data || {};
  return (
    // JSX structure for individual blog posts...
    <Suspense>
      <Await resolve={blogPosts}>
        <div className="page-width flex flex-row text-primary">
          <div className="w-1/5 py-5 pr-[50px]">
            <BlogSidebar sidebarBlogPosts={sidebarBlogPosts} />
          </div>
          <div className="flex w-4/5 flex-col">
            <h1 className="self-center py-5 text-xl2">
              The J.McL Life - <i>Our Blog</i>
            </h1>
            <BlogBreadcrumb />
            <BlogIndividual blogPosts={blogPosts} />
          </div>
        </div>
      </Await>
    </Suspense>
  );
}
