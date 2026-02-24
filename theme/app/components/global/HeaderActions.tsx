import {useMatches} from '@remix-run/react';
import {CartForm} from '@shopify/hydrogen';
import clsx from 'clsx';
import {lazy, Suspense, useCallback, useEffect, useState} from 'react';

import {useDrawer} from '~/components/cart/CartDrawer';
import CartToggle from '~/components/cart/CartToggle';
import {UserIcon} from '~/components/icons/User';
import {Link} from '~/components/Link';
import {useCartFetchers} from '~/hooks/useCartFetchers';
import {useHydration} from '~/hooks/useHydration';
import WishlistToggle from '~/lib/swym/components/wishlist/WishlistToggle';

import AutocompleteSearchInput from '../filters/AutocompleteSearchInput';
import SearchIcon from '../icons/Search';

const AuthModal = lazy(() => import('./AuthModal'));
const CartDrawer = lazy(() =>
  import('~/components/cart/CartDrawer').then((module) => ({
    default: module.CartDrawer,
  })),
);

type Props = {
  toggleDiv: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  resultsInputRef: React.RefObject<HTMLInputElement>;
  isDivOpen: boolean;
  closeDiv: () => void;
  isInputEmptyAndFocused: boolean;
  setIsInputEmptyAndFocused: (isInputEmptyAndFocused: boolean) => void;
  query: string;
  stickyHeader: string;
  onClick?: () => void;
};

export default function HeaderActions({
  toggleDiv,
  handleInputChange,
  handleSearch,
  resultsInputRef,
  isDivOpen,
  closeDiv,
  isInputEmptyAndFocused,
  setIsInputEmptyAndFocused,
  query,
  stickyHeader,
}: Props) {
  const isHydrated = useHydration();
  const {isOpen, openDrawer, closeDrawer, canRender} = useDrawer();
  const [root] = useMatches();
  const customer = root.data?.customer;
  const cart = root.data?.cart;
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [canRenderAuthModal, setCanRenderAuthModal] = useState(false);

  // Grab all the fetchers that are adding to cart
  const addToCartFetchers = useCartFetchers(CartForm.ACTIONS.LinesAdd);
  const [isLoading, setIsloading] = useState(false);

  // When the fetchers array changes, open the drawer if there is an add to cart action
  useEffect(() => {
    if (isLoading && addToCartFetchers.length === 0) {
      // wait until after loading state to show cart
      // this prevents a flash of an inaccurate cart
      setIsloading(false);
      openDrawer();
      return;
    }

    if (
      isOpen ||
      addToCartFetchers.length === 0 ||
      addToCartFetchers[0].state === 'submitting'
    ) {
      return;
    }

    if (
      addToCartFetchers.length > 0 &&
      addToCartFetchers[0].state === 'loading'
    ) {
      setIsloading(true);
      return;
    }

    openDrawer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToCartFetchers, isOpen, openDrawer]);

  const handleAuthModalClose = useCallback(() => {
    setAuthModalOpen(false);
  }, []);

  const handleAuthModalOpen = useCallback(() => {
    setCanRenderAuthModal(true);
    setTimeout(() => setAuthModalOpen(true));
  }, []);

  return (
    <>
      <div className={'right-0 flex h-full items-center gap-x-3'}>
        {/* Search */}
        <div className="relative flex">
          <div className="absolute right-full top-1/2 hidden w-[200px] -translate-y-1/2 lg:flex">
            <AutocompleteSearchInput
              aria-label="Search for products"
              handleInputChange={handleInputChange}
              query={query}
              resultsInputRef={resultsInputRef}
              width="w-full"
              handleSearch={handleSearch}
              isDivOpen={isDivOpen}
              closeDiv={closeDiv}
              isInputEmptyAndFocused={isInputEmptyAndFocused}
              setIsInputEmptyAndFocused={setIsInputEmptyAndFocused}
              // @ts-ignore - onClick is passed via rest props in component
              onClick={toggleDiv}
            />
          </div>
          <button
            className={clsx([
              'w-6 lg:inline-block',
              isInputEmptyAndFocused ? 'hidden md:block' : '',
              stickyHeader !== 'visible' ||
              (isHydrated && window.scrollY === 0) ||
              !isHydrated
                ? 'block'
                : 'hidden md:block',
            ])}
            aria-expanded={isDivOpen}
            aria-controls="search-bar"
            aria-labelledby="search-label"
            onClick={handleSearch}
            data-cnstrc-search-submit-btn
          >
            <SearchIcon />
          </button>
        </div>
        {/* Account Page */}
        {customer && (
          <Link
            className={clsx([
              'hidden h-[35px] w-6 items-center rounded-sm bg-darkGray bg-opacity-0',
              'lg:flex',
              'hover:bg-opacity-10',
            ])}
            to="/account"
            prefetch="intent"
          >
            <UserIcon />
          </Link>
        )}
        {/* Sign In / Sign Up Modal */}
        {!customer && (
          <div className="hidden lg:block">
            <button onClick={handleAuthModalOpen}>
              <UserIcon />
            </button>
            <Suspense>
              {canRenderAuthModal && (
                <AuthModal
                  isOpen={authModalOpen}
                  onClose={handleAuthModalClose}
                />
              )}
            </Suspense>
          </div>
        )}
        {/* Swym Wishlist */}
        <Link
          className={clsx([
            'hidden h-[35px] w-6 items-center rounded-sm bg-darkGray bg-opacity-0',
            'lg:flex',
            'hover:bg-opacity-10',
          ])}
          to="/swym/wishlist"
          prefetch="intent"
        >
          <WishlistToggle />
        </Link>

        {/* Cart */}
        <div className="flex h-full w-6 items-center justify-center">
          <CartToggle cart={cart} isOpen={isOpen} openDrawer={openDrawer} />
        </div>
      </div>
      {canRender && (
        <Suspense>
          <CartDrawer
            open={isOpen}
            onClose={closeDrawer}
            fallbackPodId={(root.data as any).layout.fallbackPodId}
          />
        </Suspense>
      )}
    </>
  );
}
