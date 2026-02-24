import {useLocation, useMatches, useNavigate} from '@remix-run/react';
import {SearchProduct} from '@xgenai/sdk-core';
import clsx from 'clsx';
import {
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import HeaderLogo from '~/components/icons/Logo';
import {Link} from '~/components/Link';
import {useXgenClient} from '~/contexts/XgenClientContext';
import {useLinkLocalizer} from '~/hooks/useLinkLocalizer';
import {GlobalContext, useDebounce} from '~/lib/utils';
import fetchSuggestions from '~/lib/xgen/utils/fetchSuggestions';
import {trackSearchOpen} from '~/utils/eventTracking';

import AutocompleteSearchInput from '../filters/AutocompleteSearchInput';
const AutocompleteSearchResults = lazy(
  () => import('../filters/AutocompleteSearchResults'),
);
import SearchIcon from '../icons/Search';
import SanityImage from '../media/SanityImage';
import AnnouncementBanner from './announcementBanner/AnnouncementBanner';
import HeaderActions from './HeaderActions';
import MobileNavigation from './MobileNavigation';
import Navigation from './Navigation';
import StoreLocator from './StoreLocator';
import TooltipNavigation from './TooltipNavigation';

type Props = {
  stickyHeader: string;
  position?: number;
  transparentHeader?: boolean;
};

function HeaderBackgroundCSR({
  stickyHeader,
  position,
  transparentHeader,
}: Props) {
  const xgenClient = useXgenClient();
  const [root] = useMatches();
  const location = useLocation();
  const layout = root.data?.layout;
  const sanityDataset = root.data?.sanityDataset;
  const sanityProjectID = root.data?.sanityProjectID;
  const {headerLogo, announcements, megaMenu, tooltipNav, storeLocatorLink} =
    layout || {};
  const [scrolledDown, setScrolledDown] = useState(false);
  const {xgenConfig} = useContext(GlobalContext);
  const handleScroll = () => {
    setScrolledDown(window.scrollY > 100);
  };
  const headerRef = useRef<any>(null);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    // Trigger handler on mount to account for reloads
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [layout]);
  // Search
  const [isDivOpen, setIsDivOpen] = useState(false);
  const [canRenderSearchModal, setCanRenderSearchModal] = useState(false);
  const resultsInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDivOpen) {
      resultsInputRef.current?.focus();
      trackSearchOpen(xgenClient); // XGEN client might be null.
    }
  }, [isDivOpen]);

  const toggleDiv = () => {
    setCanRenderSearchModal(true);
    setTimeout(() => setIsDivOpen((prev) => !prev));
  };
  const closeDiv = () => {
    setIsDivOpen(false);
    setQuery('');
  };

  useEffect(() => {
    setQuery('');
    setProducts([]);
    setSuggestions([]);
    setIsDivOpen(false);
  }, [location.search]);

  // autocomplete logic
  const [query, setQuery] = useState<string>('');
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [productCount, setProductCount] = useState<number>(0);
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  const [queryId, setQueryId] = useState<string>('');
  const latestQuery = useRef('');

  const [isInputEmptyAndFocused, setIsInputEmptyAndFocused] = useState(false);

  const fetchSuggestionsDebounced = useDebounce(async (inputValue: string) => {
    // Only fetch suggestions if the input value is at least 3 characters long
    if (!xgenClient || inputValue.length < 3) return;

    const [xgSearchResponse, xgSuggestionsResponse] = await Promise.all([
      xgenClient?.search.getResults({
        query: inputValue,
        options: {
          collection: 'default',
          deploymentId: xgenConfig?.deploymentId,
        },
      }),
      await fetchSuggestions(xgenClient, {
        query: inputValue,
        collection: 'default',
        deploymentId: xgenConfig?.deploymentId,
      }),
    ]);
    const xgSearchProducts = xgSearchResponse?.items;
    const productCount = xgSearchProducts?.length || 0;

    if (xgSearchProducts && inputValue === latestQuery.current) {
      setProducts(xgSearchProducts || []);
      setSuggestions(xgSuggestionsResponse);
      setQueryId(xgSearchResponse?.queryId);
      setCanRenderSearchModal(true);
      setTimeout(() => setIsDivOpen(true));
    }
    setProductCount(productCount);
  }, 500);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setQuery(inputValue);
      latestQuery.current = inputValue;

      if (inputValue) {
        fetchSuggestionsDebounced(inputValue);
      } else {
        setProducts([]);
        setSuggestions([]);
        setTimeout(() => {
          if (document.activeElement !== resultsInputRef.current) {
            setIsDivOpen(false);
          }
        }, 500);
      }
      setHasStartedTyping(inputValue.length > 0);
    },
    [fetchSuggestionsDebounced],
  );

  const navigate = useNavigate();
  const localizedHref = useLinkLocalizer();

  const handleSearch = () => {
    if (query) {
      navigate(localizedHref(`/search?q=${encodeURIComponent(query)}&page=1`));
    }
    toggleDiv();
  };

  useEffect(() => {
    const inputEl = resultsInputRef.current;
    const handleFocus = () => {
      if (
        document.activeElement === resultsInputRef.current &&
        hasStartedTyping
      ) {
        setIsDivOpen(true);
      }
    };

    if (hasStartedTyping) inputEl?.addEventListener('focus', handleFocus);
    return () => {
      if (hasStartedTyping) inputEl?.removeEventListener('focus', handleFocus);
    };
  }, [hasStartedTyping]);

  return (
    <div
      className={`group inset-0 w-full ${
        stickyHeader === 'visible'
          ? 'bg-white transition duration-500 lg:bg-transparent hover:lg:bg-white'
          : 'bg-opacity-0 lg:bg-transparent'
      }`}
      ref={headerRef}
    >
      <AnnouncementBanner announcementSettings={announcements} />
      <div
        className={`h-[5rem] lg:h-[8rem] ${
          position === 0 && transparentHeader
            ? 'transition duration-500 ease-in-out group-hover:lg:filter-none'
            : ''
        }`}
      >
        <div className="relative flex min-h-[75px] items-center justify-between bg-white px-[20px] lg:border-b lg:border-lightGray lg:px-[40px]">
          {megaMenu && (
            <MobileNavigation
              megaMenu={megaMenu}
              storesLink={storeLocatorLink}
              tooltipNav={tooltipNav}
              stickyHeader={stickyHeader}
            />
          )}
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
          {/* Accounts, country selector + cart toggle */}
          <HeaderActions
            isDivOpen={isDivOpen}
            toggleDiv={toggleDiv}
            closeDiv={closeDiv}
            handleInputChange={handleInputChange}
            query={query}
            resultsInputRef={resultsInputRef}
            handleSearch={handleSearch}
            isInputEmptyAndFocused={isInputEmptyAndFocused}
            setIsInputEmptyAndFocused={setIsInputEmptyAndFocused}
            stickyHeader={stickyHeader}
          />
        </div>
        <div
          className={clsx('relative transition-all duration-300 ease-out', {
            'hidden lg:block': stickyHeader !== 'visible' || !scrolledDown,
            block: stickyHeader === 'visible' && scrolledDown,
          })}
        >
          {/* mobile search bar */}
          <div
            id="search-bar"
            aria-controls="search-bar"
            aria-labelledby="search-label"
            className={`relative flex w-full flex-row items-center justify-center gap-4 bg-white px-5 py-4 lg:hidden `}
          >
            <AutocompleteSearchInput
              handleInputChange={handleInputChange}
              handleSearch={handleSearch}
              onClick={toggleDiv}
              query={query}
              resultsInputRef={resultsInputRef}
              width="w-[400px]"
              isDivOpen={isDivOpen}
              closeDiv={closeDiv}
              isInputEmptyAndFocused={isInputEmptyAndFocused}
              setIsInputEmptyAndFocused={setIsInputEmptyAndFocused}
              aria-label="Search for products"
            />
            <button
              className={`w-6 ${
                isInputEmptyAndFocused || query ? 'hidden md:block' : ''
              }`}
              aria-expanded={isDivOpen}
              aria-controls="search-bar"
              aria-labelledby="search-label"
              onClick={handleSearch}
              data-cnstrc-search-submit-btn
            >
              <SearchIcon />
            </button>
          </div>
          {megaMenu && (
            <div
              className={`${
                position === 0 && transparentHeader
                  ? 'invert-white transition duration-500 ease-in-out group-hover:lg:filter-none'
                  : ''
              }`}
            >
              <Navigation
                megaMenu={megaMenu}
                transparentHeader={transparentHeader}
                position={position}
              />
            </div>
          )}
        </div>
      </div>

      {canRenderSearchModal && (
        <Suspense>
          <AutocompleteSearchResults
            products={products}
            suggestions={suggestions.slice(0, 4)}
            toggleDiv={toggleDiv}
            handleInputChange={handleInputChange}
            query={query}
            closeDiv={closeDiv}
            productCount={productCount}
            isDivOpen={isDivOpen}
            resultsInputRef={resultsInputRef}
            handleSearch={handleSearch}
            isInputEmptyAndFocused={isInputEmptyAndFocused}
            setIsInputEmptyAndFocused={setIsInputEmptyAndFocused}
            queryId={queryId}
          />
        </Suspense>
      )}
    </div>
  );
}

export default HeaderBackgroundCSR;
