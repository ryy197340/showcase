import {useMatches} from '@remix-run/react';
import clsx from 'clsx';

import HeaderLogo from '~/components/icons/Logo';
import {Link} from '~/components/Link';

import CabanaTempLogo from '../icons/CabanaTempLogo';
import SanityImage from '../media/SanityImage';
import AnnouncementBanner from './announcementBanner/AnnouncementBanner';
import MobileNavigation from './MobileNavigation';
import Navigation from './Navigation';
import StoreLocator from './StoreLocator';
import TooltipNavigation from './TooltipNavigation';

type Props = {
  stickyHeader: string;
  layout?: {
    announcements?: any;
    megaMenu?: any;
    tooltipNav?: any;
    storeLocatorLink?: any;
  };
};

export default function HeaderBackground({stickyHeader, layout}: Props) {
  const {headerLogo, announcements, megaMenu, tooltipNav, storeLocatorLink} =
    layout || {};
  const [root] = useMatches();
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;

  return (
    <div
      className={`inset-0 w-full ${
        stickyHeader === 'visible' ? 'bg-white' : 'bg-opacity-0 lg:bg-white'
      }`}
    >
      <AnnouncementBanner announcementSettings={announcements} />
      <div className="h-[5rem] lg:h-[8rem]">
        <div className="page-width relative flex min-h-[75px] items-center justify-between bg-white px-[20px] lg:px-[40px]">
          {/* SSR note: simplified param needs for SSR mobileNavigation  */}
          {megaMenu && <MobileNavigation megaMenu={megaMenu} />}
          <div className="flex h-[75px] flex-row gap-[25px]">
            {/* Location Pin */}
            <StoreLocator storesLink={storeLocatorLink} />
            {/* Tooltip Navigation */}
            {tooltipNav && <TooltipNavigation tooltipMenuLinks={tooltipNav} />}
          </div>
          {/* Logo */}
          <Link to="/" prefetch="intent">
            <div
              className={clsx(
                'absolute bottom-0 left-1/2 top-0 flex w-[175px] -translate-x-1/2 items-center',
                'md:w-[240px]',
              )}
            >
              {/* sanity header logo */}
              {headerLogo && (
                <SanityImage
                  alt={headerLogo.altText}
                  src={headerLogo.asset?._ref}
                  dataset={sanityDataset}
                  projectId={sanityProjectID}
                  height={headerLogo.height}
                  width={headerLogo.width}
                  className="h-[58px]"
                />
              )}

              {!headerLogo && <HeaderLogo className="h-auto w-full" />}
            </div>
          </Link>
          {/* SSR note: Removed accounts, country selector + cart toggle */}
        </div>
        {/* SSR note: Removing window based css */}
        <div
          className={clsx('relative transition-all duration-[400ms] ease-out')}
        >
          {/* mobile search bar */}
          <div
            id="search-bar"
            aria-controls="search-bar"
            aria-labelledby="search-label"
            className={`relative flex w-full flex-row items-center justify-center gap-4 bg-white px-5 py-4 lg:hidden `}
          >
            {/* SSR note: removing interactive elements */}
            {megaMenu && <Navigation megaMenu={megaMenu} />}
          </div>
        </div>
      </div>
      {/* SSR note: removing interactive elements */}
    </div>
  );
}
