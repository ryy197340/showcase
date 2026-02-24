import {useLocation} from '@remix-run/react';

import {SanityLink, SidebarLink} from '~/lib/sanity';

import {FacetCaret} from '../icons/FacetCaret';
import {Link} from '../Link';

type Props = {
  handleClick: (slug: string) => void;
  links: SanityLink[] | SidebarLink[];
  selectedData?: string | undefined;
  title?: string;
  isOpen: boolean;
};

export default function Sidebar({
  handleClick,
  links,
  selectedData,
  title,
  isOpen,
}: Props) {
  const location = useLocation();
  const itemClasses = `hover:bg-gray-100 block px-5 py-2 text-[12px] leading-[16px] text-primary hover:underline lg:py-[10px] lg:text-left`;

  const isCurrentPage = (slug: string) => {
    return location.pathname.includes(slug) ? 'font-semibold' : '';
  };
  return (
    <div className="w-full px-4 text-left lg:w-1/5 lg:px-1">
      <div className="relative mb-[30px]">
        <button
          onClick={() => handleClick('')}
          className="bg-gray-200 hover:bg-gray-300 flex w-full items-center justify-between border border-lineGray px-5 py-4 text-left text-[12px] leading-[16px] lg:cursor-default lg:border-l-0 lg:border-r-0 lg:border-t-0 lg:py-[10px] lg:font-hoefler lg:text-[22px] lg:leading-[36px]"
        >
          {title ?? title}
          <span className={`lg:hidden ${isOpen ? 'rotate-180 transform' : ''}`}>
            <FacetCaret />
          </span>
        </button>
        <ul
          className={`absolute top-full z-20 flex w-full flex-col border border-t-0 border-lineGray bg-white lg:relative lg:border-none ${
            isOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          {links.map((linkItem) => {
            const linkUrl =
              linkItem._type === 'linkInternal' && linkItem.slug
                ? linkItem.slug
                : linkItem._type === 'linkExternal' && linkItem.url
                ? linkItem.url
                : undefined;
            return (
              <li
                key={linkItem._key}
                className={`border-b border-lineGray last:border-b-0 lg:border-l-0 lg:border-r-0 lg:border-t-0 lg:last:border-b ${
                  linkItem._type === 'sidebarAccountLink' &&
                  linkItem.link === location.pathname
                    ? 'hidden'
                    : ''
                }`}
              >
                {linkItem._type === 'sidebarAccountLink' && (
                  <button
                    onClick={() => handleClick(linkItem.slug)}
                    className={`${itemClasses} ${
                      (linkItem._type === 'sidebarAccountLink' &&
                        selectedData === linkItem.slug) ||
                      (selectedData === undefined &&
                        linkItem._type === 'sidebarAccountLink' &&
                        linkItem.slug === 'personal-information')
                        ? 'font-semibold'
                        : ''
                    }`}
                  >
                    {linkItem.title}
                  </button>
                )}
                {typeof linkUrl === 'string' && (
                  <Link
                    to={linkUrl}
                    prefetch="intent"
                    onClick={() => handleClick('')}
                    className={`${itemClasses} ${isCurrentPage(linkUrl)}`}
                  >
                    {linkItem.title}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
