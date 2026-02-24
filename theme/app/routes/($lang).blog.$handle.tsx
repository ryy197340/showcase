import {Await, useLoaderData} from '@remix-run/react';
import {Suspense} from 'react';

import BlogBreadcrumb from '~/components/blog/BlogBreadcrumb';
import BlogCard from '~/components/blog/BlogCard';
import BlogSidebar from '~/components/blog/BlogSidebar';

// Define the Blog component for the blog route
export default function Blog() {
  const blogPosts = useLoaderData<typeof loader>() as unknown as {
    blog: any;
  };

  return (
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
            <BlogCard
              blogPosts={blogPosts}
              isProductGrid={false}
              isBlogGrid={true}
              isBlogModule={true}
            />
          </div>
        </div>
      </Await>
    </Suspense>
  );
}
