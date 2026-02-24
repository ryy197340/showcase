import {Disclosure, Transition} from '@headlessui/react';
import clsx from 'clsx';
import {Fragment} from 'react';

import AuthModal from '~/components/global/AuthModal';
import MegaMenuLinks from '~/components/global/megaMenu/MegaMenuLinksMobile';
import MobileNavHeader from '~/components/global/MobileNavHeader';
import TooltipNavigation from '~/components/global/TooltipNavigationMobile';
import LocationPin from '~/components/icons/LocationPin';
import {UserIcon} from '~/components/icons/User';
import {Link} from '~/components/Link';
import type {MegaMenuItem, SanityMenuLink} from '~/lib/sanity';
import WishlistToggle from '~/lib/swym/components/wishlist/WishlistToggle';

type Props = {
  open: boolean;
  toggleOpenClose: () => void;
  megaMenu: MegaMenuItem[];
  storesLink: SanityMenuLink;
  tooltipNav: SanityMenuLink[];
  isAuthenticated: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalOpen: boolean;
};

const MobileNavigationContent = ({
  open,
  toggleOpenClose,
  megaMenu,
  storesLink,
  tooltipNav,
  isAuthenticated,
  setAuthModalOpen,
  authModalOpen,
}: Props) => {
  return (
    <Transition appear show={open}>
      <Disclosure>
        {/* Panel */}
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="ease-in-out duration-500"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <Disclosure.Panel
            className={`menu-panel fixed bottom-0 left-0 right-0 top-0 z-[5] h-full w-full overflow-y-auto border-t border-lightGray bg-white`}
          >
            <div className="space-y-4 px-4 pb-8">
              <MobileNavHeader onClose={toggleOpenClose} />
              <div className="text-s space-y-1 font-bold">
                {
                  <MegaMenuLinks
                    megaMenuItems={megaMenu}
                    open={open}
                    handleClose={toggleOpenClose}
                  />
                }
              </div>

              {!isAuthenticated && (
                <div className="flex h-[2.4rem] items-center justify-center space-y-1 rounded-sm border bg-darkGray bg-opacity-0 px-4 px-4 py-2 duration-150 hover:bg-opacity-10">
                  {/* Account */}
                  <button
                    onClick={() => {
                      setAuthModalOpen(true);
                    }}
                  >
                    <span className="mr-2 text-xs uppercase">
                      Sign Up / Sign In
                    </span>
                    <AuthModal
                      isOpen={authModalOpen}
                      onClose={() => setAuthModalOpen(false)}
                    />
                  </button>
                </div>
              )}

              <div className="space-y-1">
                {/* Account */}
                {isAuthenticated && (
                  <Link
                    className={clsx(
                      '-ml-2 inline-flex h-[2.4rem] items-center rounded-sm bg-darkGray bg-opacity-0 px-4 py-2 text-2xs font-bold uppercase duration-150',
                      'hover:bg-opacity-10',
                    )}
                    onClick={toggleOpenClose}
                    to="/account"
                  >
                    <UserIcon />
                    <span className="mr-2 pl-4">My Account</span>
                  </Link>
                )}
                <Link
                  to="/swym/wishlist"
                  className={clsx(
                    '-ml-2 flex h-[2.4rem] items-center rounded-sm bg-darkGray bg-opacity-0 px-4 py-2 text-2xs font-bold uppercase duration-150',
                    'hover:bg-opacity-10',
                  )}
                  onClick={toggleOpenClose}
                >
                  <WishlistToggle showText={true} />
                </Link>
                {storesLink?._type === 'linkInternal' && storesLink?.slug && (
                  <Link
                    to={storesLink?.slug}
                    key={storesLink?._key}
                    className={clsx(
                      '-ml-2 flex h-[2.4rem] items-center rounded-sm bg-darkGray bg-opacity-0 px-4 py-2 text-2xs font-bold uppercase duration-150',
                      'hover:bg-opacity-10',
                    )}
                    onClick={toggleOpenClose}
                  >
                    <LocationPin />
                    <span className="pl-4 pt-[3px]">STORES</span>
                  </Link>
                )}
                <div
                  className={clsx(
                    '-ml-2 flex h-[2.4rem] items-center rounded-sm bg-darkGray bg-opacity-0 px-4 py-2 text-2xs uppercase duration-150 hover:bg-opacity-10',
                  )}
                >
                  {tooltipNav && (
                    <TooltipNavigation
                      tooltipMenuLinks={tooltipNav}
                      handleClose={toggleOpenClose}
                    />
                  )}
                </div>
                {/* JME-351 */}
                {/*<div className="-ml-2 flex h-[2.4rem] items-center rounded-sm bg-darkGray bg-opacity-0 px-4 py-2 text-2xs font-bold uppercase duration-150 hover:bg-opacity-10">*/}
                {/*  <CountrySelector />*/}
                {/*</div>*/}
              </div>
            </div>
          </Disclosure.Panel>
        </Transition.Child>
      </Disclosure>
    </Transition>
  );
};

export default MobileNavigationContent;
