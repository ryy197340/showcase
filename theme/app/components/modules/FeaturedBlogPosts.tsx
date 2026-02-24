import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';

import {Link} from '~/components/Link';
import {useHydration} from '~/hooks/useHydration';
import {
  FeaturedBlogPostItem,
  FeaturedBlogPosts as FeaturedBlogPostsType,
} from '~/lib/sanity';

import FeaturedBlogPostsSSR from './FeaturedBlogPostsSSR';

type Props = {
  module: FeaturedBlogPostsType & {blogPosts: FeaturedBlogPostItem[]};
};

const FEATURED_BLOG_POST_ITEM = clsx(
  'featured-blog-post-item relative flex h-auto w-full flex-col text-center md:justify-end md:min-h-[600px] xl:w-1/3 lg:items-center md:w-[calc(50%-4px)]',
);

const BLOG_POST_IMAGE_OVERLAY = clsx(
  'hidden xl:block h-full w-full bg-gradient-to-t from-black to-transparent opacity-60 absolute top-0 left-0 z-10',
);
const BLOG_POST_IMAGE_CONTAINER = clsx(
  'blog-post-image h-[465px] xl:h-[600px] w-full overflow-hidden relative',
);

const BLOG_POST_DETAILS = clsx(
  'blog-post-details z-10 mb-[25px] mt-5 flex flex-col gap-4 text-primary xl:mt-0 xl:text-white',
);

const BLOG_POST_BUTTON_LINK = clsx(
  'button-link-border-b after:bg-primary xl:block xl:after:bg-white',
);

function FeaturedBlogPostsCSR({module}: Props) {
  if (!module.blogPosts) {
    // eslint-disable-next-line no-console
    console.log('Unable to find any blog posts');
    return null;
  }

  return (
    <div className="page-width featured-blog-posts-container pt-5">
      <h2 className="mb-10 hidden text-center md:block">
        The Latest From Our Blog
      </h2>
      <h2 className="mb-[30px] text-center md:hidden">Latest From The Blog</h2>

      {/* First Grid Item */}
      <div className="flex flex-col gap-1 text-white md:flex-row md:flex-wrap xl:flex-nowrap">
        {/* Update structure for mobile */}
        <div className={FEATURED_BLOG_POST_ITEM}>
          <div className={BLOG_POST_IMAGE_CONTAINER}>
            {/* Add an img element inside the div */}
            <Image
              src={module.blogPosts[0]?.featuredImage?.url}
              alt={module.blogPosts[0]?.title}
              className={`h-[465px] object-cover xl:h-auto ${
                module.blogPosts[0]?.featuredImageMobile?.url
                  ? 'hidden sm:block'
                  : 'block'
              }`}
              //style={{ display: 'none' }}
            />
            <div className={BLOG_POST_IMAGE_OVERLAY}></div>
            {module.blogPosts[0]?.featuredImageMobile?.url && (
              <Image
                sizes={'50vw, 100vw'}
                src={module.blogPosts[0]?.featuredImageMobile?.url}
                alt={module.blogPosts[0]?.title}
                className="absolute left-1/2 top-1/2 block h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover sm:hidden"
              />
            )}
          </div>
          <div className={BLOG_POST_DETAILS}>
            <span className="blog-category text-2xs uppercase">
              {module.blogPosts[0]?.category}
            </span>
            <h3 className="blog-title text-[24px]">
              {module.blogPosts[0]?.title}
            </h3>
            <Link
              to={`/blog/${module.blogPosts[1].category}/${module.blogPosts[0]?.slug?.current}`}
              className="read-more-link"
            >
              <span className={BLOG_POST_BUTTON_LINK}>Read More</span>
            </Link>
          </div>
        </div>

        {/* Second Grid Item */}
        <div className={FEATURED_BLOG_POST_ITEM}>
          <div className={BLOG_POST_IMAGE_CONTAINER}>
            <div className={BLOG_POST_IMAGE_OVERLAY}></div>
            <Image
              sizes={'50vw, 100vw'}
              src={module.blogPosts[1]?.featuredImage?.url}
              alt={module.blogPosts[1]?.title}
              className={`mb-5 h-[465px] object-cover xl:h-auto ${
                module.blogPosts[1]?.featuredImageMobile?.url
                  ? 'hidden sm:block'
                  : 'block'
              }`}
            />
            {module.blogPosts[1]?.featuredImageMobile?.url && (
              <Image
                sizes={'50vw, 100vw'}
                src={module.blogPosts[1]?.featuredImageMobile?.url}
                alt={module.blogPosts[1]?.title}
                className="absolute left-1/2 top-1/2 block h-full w-full -translate-x-1/2 -translate-y-1/2 object-cover sm:hidden"
              />
            )}
          </div>
          <div className={BLOG_POST_DETAILS}>
            <span className="blog-category text-2xs uppercase xl:text-white">
              {module.blogPosts[1]?.category}
            </span>
            <h3 className="blog-title text-[24px] xl:text-white">
              {module.blogPosts[1]?.title}
            </h3>
            <Link
              to={`/blog/${module.blogPosts[1].category}/${module.blogPosts[1]?.slug?.current}`}
              className="read-more-link"
            >
              <span className={BLOG_POST_BUTTON_LINK}>Read More</span>
            </Link>
          </div>
        </div>

        {/* Third Grid Item */}
        <div className="featured-blog-post-row flex w-full flex-col items-center justify-between gap-4 text-center text-primary lg:h-[600px] xl:w-1/3">
          <div className="line-el mx-5 mt-[20px] w-full border-b border-t border-lightGray lg:mt-0"></div>
          {/* Row 1 */}
          <div className="blog-post-details flex flex-col gap-4 px-5">
            <span className="blog-category text-2xs uppercase">
              {module.blogPosts[2]?.category}
            </span>
            <h3 className="blog-title text-[24px]">
              {module.blogPosts[2]?.title}
            </h3>
            <Link
              to={`/blog/${module.blogPosts[2].category}/${module.blogPosts[2]?.slug?.current}`}
              className="read-more-link"
            >
              <span className="button-link-border-b after:bg-primary lg:block">
                Read More
              </span>
            </Link>
          </div>
          <div className="line-el mx-5 mt-[20px] w-full border-b border-t border-lightGray lg:mt-0"></div>
          {/* Row 2 */}
          <div className="mod-max-width blog-post-details flex w-full flex-col gap-4">
            <span className="blog-category text-2xs uppercase">
              {module.blogPosts[3]?.category}
            </span>
            <h3 className="blog-title text-[24px]">
              {module.blogPosts[3]?.title}
            </h3>
            <Link
              to={`/blog/${module.blogPosts[3].category}/${module.blogPosts[3]?.slug?.current}`}
              className="read-more-link"
            >
              <span className="button-link-border-b after:bg-primary lg:block">
                Read More
              </span>
            </Link>
          </div>
          <div className="line-el mx-5 mt-[20px] w-full border-b border-t border-lightGray lg:mt-0"></div>
          {/* Row 3 */}
          <div className="blog-post-details flex flex-col gap-4 px-5">
            <span className="blog-category text-2xs uppercase">
              {module.blogPosts[4]?.category}
            </span>
            <h3 className="blog-title text-[24px] text-primary">
              {module.blogPosts[4]?.title}
            </h3>
            <Link
              to={`/blog/${module.blogPosts[4].category}/${module.blogPosts[4]?.slug?.current}`}
              className="read-more-link"
            >
              <span className="button-link-border-b text-primary after:bg-primary lg:block">
                Read More
              </span>
            </Link>
          </div>
          <div className="line-el mx-5 mt-[20px] w-full border-b border-t border-lightGray lg:mt-0"></div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturedBlogPosts(props: any) {
  const isHydrated = useHydration();
  return (
    <>
      {isHydrated ? (
        <FeaturedBlogPostsCSR {...props} />
      ) : (
        <FeaturedBlogPostsSSR {...props} />
      )}
    </>
  );
}
