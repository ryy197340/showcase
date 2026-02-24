import {stegaClean} from '@sanity/client/stega';
import {useEffect, useState} from 'react';

import {FacetCaret} from '~/components/icons/FacetCaret';
import {BlogPost} from '~/lib/sanity';

import LocalizedA from '../global/LocalizedA';

type Props = {
  sidebarBlogPosts?: any;
};
export default function BlogSidebar({sidebarBlogPosts}: Props) {
  const [recentPostsVisible, setRecentPostsVisible] = useState(false);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const getMonthYearText = (dateString: string) => {
    const date = new Date(dateString);
    const monthYear = date.toLocaleString('default', {
      month: 'long',
      year: 'numeric',
    });
    return monthYear;
  };
  const getMonthYearLink = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0
    const year = date.getFullYear();
    return `${month}-${year}`;
  };

  const recentPosts = sidebarBlogPosts
    ? sidebarBlogPosts
        .filter((post: BlogPost) => post.includeInRecent === true)
        .sort(
          (a: BlogPost, b: BlogPost) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .slice(0, 5)
    : [];

  const archiveList: {[key: string]: BlogPost[]} = sidebarBlogPosts
    ? sidebarBlogPosts
        .sort(
          (a: BlogPost, b: BlogPost) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        )
        .reduce((acc: {[key: string]: BlogPost[]}, post: BlogPost) => {
          const monthYear = getMonthYearText(post.date);
          if (!acc[monthYear]) {
            acc[monthYear] = [];
          }
          acc[monthYear].push(post);
          return acc;
        }, {})
    : {};

  useEffect(() => {
    const handleScreenResize = () => {
      if (window.innerWidth >= 768) {
        setRecentPostsVisible(true);
        setArchiveVisible(true);
      } else {
        setRecentPostsVisible(false);
        setArchiveVisible(false);
      }
    };

    handleScreenResize(); // Set initial visibility based on screen size

    window.addEventListener('resize', handleScreenResize);

    return () => window.removeEventListener('resize', handleScreenResize);
  }, []);

  if (!sidebarBlogPosts) {
    return <div>Loading sidebar...</div>;
  }

  return (
    <div className="sidebar breadcrumb flex w-full flex-col gap-10 text-xs text-primary md:mt-[117px]">
      <div>
        <h3 className="border-b border-lightGray border-opacity-50	text-xl md:border-none">
          <button
            onClick={() => setRecentPostsVisible(!recentPostsVisible)}
            className="flex w-full items-center justify-between"
          >
            Recent Posts
            <span className="ml-2 md:hidden">
              {recentPostsVisible ? (
                <FacetCaret direction="down" />
              ) : (
                <FacetCaret direction="up" />
              )}
            </span>
          </button>
        </h3>
        {recentPostsVisible && (
          <ul className="recent-posts flex flex-col gap-[10px] border-b border-t border-lineGray border-opacity-50	py-4">
            {recentPosts.map((post: any, index: number) => (
              <li key={post._id}>
                <LocalizedA
                  href={`/blog/${stegaClean(post.category)}/${stegaClean(
                    post.slug.current,
                  )}`}
                >
                  {post.title}
                </LocalizedA>
                {index !== recentPosts.length - 1 && (
                  <div
                    className="border-b border-lineGray border-opacity-50"
                    style={{marginTop: '8px', marginBottom: '8px'}}
                  ></div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="pb-15 pt-[40px] md:pb-0 md:pt-0">
        <h3 className="border-b border-lightGray border-opacity-50	text-xl">
          <button
            onClick={() => setArchiveVisible(!archiveVisible)}
            className="flex w-full items-center justify-between"
          >
            Archive
            <span className="ml-2 md:hidden">
              {archiveVisible ? (
                <FacetCaret direction="down" />
              ) : (
                <FacetCaret direction="up" />
              )}
            </span>
          </button>
        </h3>
        {archiveVisible && (
          <ul className="pt-3">
            {Object.keys(archiveList).map((monthYear: string) => {
              const formattedLink = getMonthYearLink(monthYear);
              return (
                <li key={monthYear}>
                  <LocalizedA href={`/blog/${formattedLink}`}>
                    {monthYear}
                  </LocalizedA>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
