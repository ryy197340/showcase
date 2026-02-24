import clsx from 'clsx';
import {
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import CloseIcon from '~/components/icons/Close';
import MenuIcon from '~/components/icons/Menu';
import {useHydration} from '~/hooks/useHydration';
import type {MegaMenuItem, SanityMenuLink} from '~/lib/sanity';
import {GlobalContext} from '~/lib/utils';

import MegaMenuLinks from './megaMenu/MegaMenuLinksMobile';

const MobileNavigationContent = lazy(() => import('./MobileNavigationContent'));

const noop = () => {};

type Props = {
  megaMenu: MegaMenuItem[];
  storesLink: SanityMenuLink;
  tooltipNav: SanityMenuLink[];
  stickyHeader: string;
};

function MobileNavigationCSR({megaMenu, storesLink, tooltipNav}: Props) {
  const isHydrated = useHydration();
  const [open, setOpen] = useState(false);
  const {isAuthenticated} = useContext(GlobalContext);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [canRenderMenu, setCanRenderMenu] = useState(false);

  const toggleOpenClose = useCallback(() => {
    setCanRenderMenu(true);
    setTimeout(() => {
      setOpen((prev) => !prev);
    });
  }, []);

  //if mobile nav menu is open, disable scrolling in background
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
    } else {
      const scrollY = -parseInt(document.body.style.top || '0');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollY);
    }

    return () => {
      // Clean up on unmount
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
    };
  }, [open]);

  return (
    <>
      <button
        className={clsx(
          'absolute left-0 flex h-full items-center p-4 text-sm font-bold',
          'hover:opacity-50',
          'md:ml-4',
          'lg:hidden',
        )}
        onClick={toggleOpenClose}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {!isHydrated && (
        <div className="hidden">
          {/* SSR note: only rendering relevant links, passing null function to fulfill onclick */}
          <MegaMenuLinks
            megaMenuItems={megaMenu}
            handleClose={noop}
            open={false}
          />
        </div>
      )}
      {canRenderMenu && (
        <Suspense>
          <MobileNavigationContent
            open={open}
            toggleOpenClose={toggleOpenClose}
            megaMenu={megaMenu}
            storesLink={storesLink}
            tooltipNav={tooltipNav}
            isAuthenticated={isAuthenticated}
            setAuthModalOpen={setAuthModalOpen}
            authModalOpen={authModalOpen}
          />
        </Suspense>
      )}
    </>
  );
}

export default MobileNavigationCSR;
