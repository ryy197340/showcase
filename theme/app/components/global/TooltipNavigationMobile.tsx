import clsx from 'clsx';
import {useState} from 'react';

import {Link} from '~/components/Link';
import type {SanityMenuLink} from '~/lib/sanity';

import ChatBubbles from '../icons/ChatBubbles';

type Props = {
  tooltipMenuLinks: SanityMenuLink[];
  handleClose: () => void;
};

export default function TooltipNavigation({
  tooltipMenuLinks,
  handleClose,
}: Props) {
  const [isActive, setIsActive] = useState(false);

  const handleClick = () => {
    setIsActive(!isActive);
  };

  return (
    <nav
      className={clsx('relative w-full items-stretch gap-6 text-xs', 'lg:flex')}
    >
      <button
        className={clsx(
          'relative flex h-full w-full flex-col gap-x-[30px] self-center',
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-[10px]">
          <ChatBubbles stroke="#13294E" />
          <div className="pl-2 pt-[3px] text-2xs font-bold uppercase">
            Customer Service
          </div>
        </div>

        <div
          className={clsx(
            'absolute -left-1.5 top-40 z-10 block w-full bg-white px-[20px] py-[18px]',
            {hidden: !isActive},
          )}
        >
          <ul className="text-left">
            {tooltipMenuLinks?.map((link) => {
              if (link._type === 'linkAndText') {
                return (
                  <li
                    key={link._key}
                    className={clsx(
                      'flex w-full border-collapse flex-col gap-1 py-1',
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
                                `font-normal cursor-default p-0${
                                  i == 0
                                    ? ' text-[10px] font-medium'
                                    : ' text-[12px]'
                                }`,
                                {
                                  hidden: !isActive,
                                },
                              )}
                              style={{lineHeight: '24px'}}
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
                                  {hidden: !isActive},
                                )}
                                onClick={handleClose}
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
                              onClick={handleClose}
                            >
                              {thisLink.title}
                            </Link>;
                          }
                        };
                        return <div key={thisLink._key}>{returnLink()}</div>;
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
                        'linkTextNavigation w-full border-collapse border py-4 hover:border-b-transparent',
                        {hidden: !isActive},
                      )}
                    >
                      {link.title} –
                    </div>
                    <div
                      className={clsx('my-1 ml-8', {
                        hidden: !isActive,
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
                      'flex w-full border-collapse items-center gap-1',
                      {hidden: !isActive},
                    )}
                    key={link._key}
                  >
                    <a
                      className="linkTextNavigation font-normal relative whitespace-nowrap"
                      href={link.url}
                      rel="noreferrer"
                      target={link.newWindow ? '_blank' : '_self'}
                      onClick={handleClose}
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
                    className={clsx('flex border-collapse items-center gap-1', {
                      hidden: !isActive,
                    })}
                    key={link._key}
                  >
                    <Link
                      className="linkTextNavigation font-normal relative whitespace-nowrap"
                      to={link.slug}
                      onClick={handleClose}
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
      </button>
    </nav>
  );
}
