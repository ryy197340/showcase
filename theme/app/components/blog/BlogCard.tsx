import {stegaClean} from '@sanity/client/stega';
import {Image} from '@shopify/hydrogen';
import clsx from 'clsx';
import {v4 as uuidv4} from 'uuid';

import {BlogPost} from '~/lib/sanity';

import LocalizedA from '../global/LocalizedA';

type Props = {
  blogPosts?: BlogPost[];
  isProductGrid?: boolean;
  isBlogGrid?: boolean;
  isBlogModule?: boolean;
};

export default function BlogCard({
  blogPosts,
  isProductGrid,
  isBlogGrid,
  isBlogModule,
}: Props) {
  return (
    <div className="" key={uuidv4()}>
      <div className="blog-card grid grid-cols-1 gap-x-3 gap-y-7 md:grid-cols-2 md:gap-y-15">
        {blogPosts &&
          blogPosts.map(function (post: any) {
            return (
              <div
                key={post._id}
                className={clsx(
                  'blog-modules flex flex-col gap-y-4 overflow-hidden text-center text-sm text-primary md:text-left',
                )}
              >
                {post?.featuredImage && (
                  <LocalizedA
                    href={`/blog/${stegaClean(post.category)}/${
                      post.slug.current
                    }`}
                  >
                    <Image
                      sizes={'50vw, 100vw'}
                      src={stegaClean(post.featuredImage.url)}
                      alt={stegaClean(post.altText)}
                      className={`${
                        post?.featuredImageMobile?.url
                          ? 'hidden md:block'
                          : 'block'
                      }`}
                    />
                    {post?.featuredImageMobile?.url && (
                      <Image
                        sizes={'50vw, 100vw'}
                        src={stegaClean(post.featuredImageMobile.url)}
                        alt={stegaClean(post.altText)}
                        className="block md:hidden"
                      />
                    )}
                  </LocalizedA>
                )}
                <p className="pt-[13px] text-2xs uppercase">{post.category}</p>
                <LocalizedA
                  href={`/blog/${post.category}/${post.slug.current}`}
                >
                  <h2 className="text-lg3">{stegaClean(post.title)}</h2>
                </LocalizedA>
                {post?.shortDescription && (
                  <p>{stegaClean(post.shortDescription)}</p>
                )}
                <LocalizedA
                  href={`/blog/${stegaClean(post.category)}/${stegaClean(
                    post.slug.current,
                  )}`}
                  className="button-link-border-b max-w-max self-center px-2 pb-1 text-xs uppercase tracking-[1.2px] md:self-start"
                >
                  Read More
                </LocalizedA>
              </div>
            );
          })}
      </div>
    </div>
  );
}
