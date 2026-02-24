import clsx from 'clsx';
import {useState} from 'react';

import {Link} from '~/components/Link';
import type {SanityMenuLink} from '~/lib/sanity';

import ChatBubbles from '../icons/ChatBubbles';

type Props = {
  tooltipMenuLinks: SanityMenuLink[];
};

export default function TooltipNavigation({tooltipMenuLinks}: Props) {
  const [isHovered, setIsHovered] = useState(false);

  const handleHover = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <nav
      className={clsx(
        'relative hidden items-stretch justify-center gap-6 bg-inherit text-xs ',
        'lg:flex',
      )}
    >
      <div
        className="relative flex h-full flex-col justify-center gap-x-[30px] self-center"
        onMouseEnter={handleHover}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center gap-[5px]">
          <ChatBubbles stroke="#13294E" />
          <div className="pt-[3px] text-2xs font-medium uppercase">
            Customer Service
          </div>
        </div>

        <div
          className={clsx(
            'font-normal absolute left-1/2 top-[75px] z-10 w-max -translate-x-1/2 border border-lightGray bg-white after:absolute after:-top-[7.5px] after:left-1/2 after:h-[14px] after:w-[14px] after:-translate-x-1/2 after:rotate-45 after:border-l after:border-t after:border-l-lightGray after:border-t-lightGray after:bg-white after:content-[""]',
            {hidden: !isHovered},
          )}
        >
          <ul>
            {tooltipMenuLinks?.map((link) => {
              if (link._type === 'linkAndText') {
                return (
                  <li
                    key={link._key}
                    className={clsx(
                      'flex w-full border-collapse flex-col items-center justify-center gap-[10px] border-b border-b-lightGray px-5 py-4 text-center',
                    )}
                  >
                    {/* Add a key to the wrapping div */}
                    {link.linkAndText.map((item, i) => {
                      if (
                        item.linkAndTextText &&
                        item.linkAndTextLink == null
                      ) {
                        return (
                          <div key={item._key}>
                            <div
                              className={clsx(
                                `cursor-default justify-center p-0${
                                  i == 0 ? ' mb-2 font-bold' : ' text-[12px]'
                                }`,
                                {
                                  hidden: !isHovered,
                                },
                              )}
                            >
                              {item.linkAndTextText}
                            </div>
                          </div>
                        );
                      } else if (
                        item.linkAndTextLink &&
                        item.linkAndTextLink.length > 0
                      ) {
                        const thisLink = item.linkAndTextLink[0];
                        const returnLink = () => {
                          if (thisLink._type == 'linkExternal') {
                            return (
                              <a
                                href={thisLink.url}
                                target={thisLink.newWindow ? '_blank' : '_self'}
                                rel={
                                  thisLink.newWindow
                                    ? 'noopener noreferrer'
                                    : ''
                                }
                                className={clsx(
                                  'linkTextNavigation font-normal text-[12px]] hover:border-b-transparent',
                                  {hidden: !isHovered},
                                )}
                              >
                                {thisLink.title}
                              </a>
                            );
                          } else if (
                            thisLink._type == 'linkInternal' &&
                            thisLink.slug
                          ) {
                            <Link
                              className="linkTextNavigation topLevelNavText"
                              to={thisLink.slug}
                            >
                              {thisLink.title}
                            </Link>;
                          }
                        };
                        return (
                          <div
                            key={thisLink._key}
                            className={clsx('justify-center')}
                          >
                            {returnLink()}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </li>
                );
              }
              if (link._type === 'collectionGroup') {
                return (
                  <li key={link._key}>
                    <div
                      className={clsx(
                        'linkTextNavigation w-full border-collapse justify-center border py-3 hover:border-b-transparent',
                        {hidden: !isHovered},
                      )}
                    >
                      {link.title} –
                    </div>
                    <div
                      className={clsx('my-1 ml-8', {
                        hidden: !isHovered,
                      })}
                    >
                      {link.collectionLinks?.map((collectionLink) => {
                        if (!collectionLink.slug) {
                          return null;
                        }
                        return (
                          <div key={collectionLink._id}>
                            <Link
                              className="linkTextNavigation font-normal relative inline-flex whitespace-nowrap"
                              to={collectionLink.slug}
                            >
                              {collectionLink.title}
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  </li>
                );
              }

              if (link._type === 'linkExternal') {
                return (
                  <li
                    className={clsx(
                      'flex w-full border-collapse items-center justify-center border-b border-b-gray py-3',
                      {hidden: !isHovered},
                    )}
                    key={link._key}
                  >
                    <a
                      className="linkTextNavigation font-normal relative whitespace-nowrap"
                      href={link.url}
                      rel="noreferrer"
                      target={link.newWindow ? '_blank' : '_self'}
                    >
                      {link.title}
                    </a>
                  </li>
                );
              }
              if (link._type === 'linkInternal') {
                if (!link.slug) {
                  return null;
                }

                return (
                  <li
                    className={clsx(
                      'flex border-collapse items-center justify-center border-b border-b-gray py-3',
                      {hidden: !isHovered},
                    )}
                    key={link._key}
                  >
                    <Link
                      className="linkTextNavigation font-normal relative whitespace-nowrap"
                      to={link.slug}
                    >
                      {link.title}
                    </Link>
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </div>
      </div>
    </nav>
  );
}
