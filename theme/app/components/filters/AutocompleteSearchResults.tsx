import {useMatches, useNavigate} from '@remix-run/react';
import {Image} from '@shopify/hydrogen';
import {SearchProduct} from '@xgenai/sdk-core/dist/types/search';
import clsx from 'clsx';
import {ChangeEvent, useContext, useEffect, useRef} from 'react';

import Button from '~/components/elements/Button';
import {useXgenClient} from '~/contexts/XgenClientContext';
import {GlobalContext} from '~/lib/utils';
import {XGEN_PODS} from '~/lib/xgen/constants';
import {trackSearchClick, trackSearchOpen} from '~/utils/eventTracking';

//import {pushSelectItem, pushViewSearchResults} from '~/utils/eventTracking';
import BestSellers from '../cart/BestSellers';
import AnnouncementBanner from '../global/announcementBanner/AnnouncementBanner';
import SearchIcon from '../icons/Search';
import {Link} from '../Link';
import PlaceholderImage from '../media/PlaceholderImage';
import ProductPrices from '../product/CioCard/ProductPrices';
import AutocompleteSearchInput from './AutocompleteSearchInput';

type Props = {
  pod?: any;
  fallbackPodId?: string;
  products: SearchProduct[];
  suggestions: string[];
  query: string;
  productCount: number;
  isDivOpen: boolean;
  resultsInputRef: React.RefObject<HTMLInputElement>;
  toggleDiv: () => void;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  closeDiv: () => void;
  handleSearch: () => void;
  isInputEmptyAndFocused: boolean;
  setIsInputEmptyAndFocused: (isInputEmptyAndFocused: boolean) => void;
  queryId: string;
};

export default function AutocompleteSearchResults({
  products,
  suggestions,
  query,
  productCount,
  isDivOpen,
  resultsInputRef,
  toggleDiv,
  handleInputChange,
  closeDiv,
  handleSearch,
  isInputEmptyAndFocused,
  setIsInputEmptyAndFocused,
  queryId,
}: Props) {
  const [root] = useMatches();
  const layout = root.data?.layout;
  const {announcements} = layout || {};
  const {xgenConfig, locale} = useContext(GlobalContext);

  //PEAK ACTIVITY ADDITIONS STARTS
  const navigate = useNavigate(); // Added navigate for URL handling
  const xgenClient = useXgenClient();

  const deploymentId = xgenConfig?.deploymentId;
  // Updated handleSearch function

  const updatedHandleSearch = () => {
    navigate(`/search?q=${query}`, {replace: true}); // Update the URL with the query

    closeDiv(); // Close the autocomplete dropdown
    // eslint-disable-next-line no-console
    console.log('Navigating to search page with query:', query); // Debug log
  };

  const displayedProducts = products.slice(0, 6); // Display the first 36 products

  // Effect to detect if user presses escape or clicks outside the results container
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeDiv();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        closeDiv();
        setIsInputEmptyAndFocused(false);
      }
    };

    // Add event listeners for both keydown and mousedown
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup both event listeners on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeDiv, setIsInputEmptyAndFocused]);

  const cardSize = 240;
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const defaultSuggestions = root?.data?.layout?.suggestedSearchTerms || [
    'Pants',
    'Turtleneck',
    'Cashmere',
    'Poncho',
    'Scarf',
    'Dresses',
    'Belt',
  ];
  // if the search view is opened, disable scrolling in background
  useEffect(() => {
    const isMobile = window.innerWidth <= 767; // Adjust breakpoint as needed

    if (!isMobile) {
      // If desktop, make sure to reset any styles just in case
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      return;
    }

    if (isDivOpen) {
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
  }, [isDivOpen]);

  if (isDivOpen || isInputEmptyAndFocused) {
    return (
      <div
        ref={searchContainerRef}
        className={clsx(
          'fixed bottom-0 left-0 top-0 z-10 flex min-h-[250px] w-[100%] flex-col overflow-x-hidden overflow-y-scroll bg-white transition-all duration-500 ease-in-out md:bottom-auto md:grid md:w-full md:gap-[20px]',
          isDivOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0',
        )}
        style={{boxShadow: '5px 0 10px rgba(0, 0, 0, 0.5)'}}
      >
        {/* <div className="h-auto">
          <AnnouncementBanner announcementSettings={announcements} />
        </div> */}
        <div className="top-0 flex w-full flex-col gap-x-3 border-b border-lightGray px-8 pb-[10px] pt-[15px] md:mt-2 md:h-[61px] md:flex-row md:justify-between md:border-none">
          <div className="flex w-full flex-row items-center">
            <SearchIcon size="18" />
            <AutocompleteSearchInput
              aria-label="Search for products"
              handleInputChange={handleInputChange}
              query={query}
              resultsInputRef={resultsInputRef}
              width="w-full"
              handleSearch={handleSearch}
              //handleSearch={updatedHandleSearch} // PEAK ACTIVITY MOD/ADDITION to Pass updated handleSearch
              isDivOpen={isDivOpen}
              closeDiv={closeDiv}
              isInputEmptyAndFocused={isInputEmptyAndFocused}
              setIsInputEmptyAndFocused={setIsInputEmptyAndFocused}
            />
          </div>
        </div>
        {products.length === 0 && (
          <div className="page-width flex w-full flex-col justify-between px-2 md:flex-row md:px-8 md:no-scrollbar">
            <div className="md:mb-[15px] md:mr-5 md:mt-2">
              <span className="mr-auto hidden w-[200px] font-bold tracking-[1px] text-black md:block">
                TOP SUGGESTIONS
              </span>
              <ul className="my-[10px] grid grid-cols-2 gap-[4px] md:mb-[30px] md:mt-[15px] md:flex md:flex-col md:gap-5">
                {defaultSuggestions.map((suggestion: string) => (
                  <li key={suggestion}>
                    <Link
                      to={`/search?q=${suggestion}`}
                      onClick={toggleDiv}
                      onKeyDown={toggleDiv}
                      prefetch="none"
                      className="flex w-full basis-1/2 rounded-[1.5rem] border bg-[#13294e] pr-4 text-center text-white sm:basis-auto md:border-none md:bg-white md:text-left md:text-black"
                    >
                      <span className="w-full py-[8px] pl-4 text-[14px] md:py-0">
                        {suggestion}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex min-h-[400px] flex-col md:mt-2 md:w-[75%]">
              <span className="pb-5 text-center font-bold tracking-[1px] text-black md:text-left">
                TRENDING NOW
              </span>
              <div
                className="space-between grow-1 m-auto flex h-full w-full flex-row gap-5"
                onClick={toggleDiv}
                onKeyDown={toggleDiv}
                role="presentation"
              >
                <BestSellers
                  fallbackPodId={XGEN_PODS.SEARCH_TRENDING_NOW.id}
                  isRestingSearch={true}
                />
              </div>
            </div>
          </div>
        )}

        {products.length > 0 && (
          <div
            className="page-width flex w-full flex-col px-2 md:flex-row md:justify-between md:px-8 md:no-scrollbar"
            data-cnstrc-autosuggest
          >
            <div className="suggestions flex flex-col flex-wrap md:mb-[15px] md:mr-5 md:mt-2 md:flex-nowrap">
              <span className="mr-auto hidden w-[200px] font-bold tracking-[1px] text-black md:block">
                TOP SUGGESTIONS
              </span>
              <ul className="my-[10px] grid grid-cols-2 gap-[4px] md:mb-[30px] md:mt-[15px] md:flex md:flex-col md:gap-5">
                {/* {(suggestions.length > 0
                  ? suggestions
                  : defaultSuggestions
                ).map((suggestion: string) => (
                  <li
                    key={suggestion}
                    data-xgen-item-section="Search Suggestions"
                  >
                    <Link
                      to={`/search?q=${suggestion}`}
                      onClick={toggleDiv}
                      onKeyDown={toggleDiv}
                      prefetch="none"
                      className="flex w-full basis-1/2 rounded-[1.5rem] border bg-[#13294e] pr-4 text-center text-white sm:basis-auto md:border-none md:bg-white md:text-left md:text-black"
                    >
                      <span className="w-full py-[8px] pl-4 text-[14px] md:py-0">
                        {suggestion}
                      </span>
                    </Link>
                  </li>
                ))} */}
                {suggestions.length > 0 ? (
                  suggestions.map((suggestion: string) => (
                    <li
                      key={suggestion}
                      data-xgen-item-section="Search Suggestions"
                    >
                      <Link
                        to={`/search?q=${suggestion}`}
                        onClick={toggleDiv}
                        onKeyDown={toggleDiv}
                        prefetch="none"
                        className="flex w-full basis-1/2 rounded-[1.5rem] border bg-[#13294e] pr-4 text-center text-white sm:basis-auto md:border-none md:bg-white md:text-left md:text-black"
                      >
                        <span className="w-full py-[8px] pl-4 text-[14px] md:py-0">
                          {suggestion}
                        </span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500 col-span-full text-sm md:text-left">
                    No related search terms found.
                  </li>
                )}
              </ul>
            </div>
            <div className="flex flex-col pt-2 md:pt-0">
              <div className="space-between flex w-full flex-row pb-2 md:mt-2">
                <span className="mr-auto pb-5 font-bold tracking-[1px] text-black ">
                  RELATED PRODUCTS
                </span>
                {query && (
                  <span className="text-center text-sm">
                    {productCount > 0 ? (
                      <Button
                        to={`/search?q=${query}`}
                        onClick={toggleDiv}
                        prefetch="intent"
                        tone="default"
                        className={
                          'mt-0 flex w-fit items-start border-none bg-white p-0 text-primary'
                        }
                      >
                        View all
                      </Button>
                    ) : (
                      `No results for “${query}”`
                    )}
                  </span>
                )}
              </div>
              <ul
                className="grid grid-cols-2 justify-items-center gap-1 md:mb-[15px] md:grid-cols-4"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    toggleDiv();
                  }
                }}
                role="listbox"
                tabIndex={0}
                data-cnstrc-item-section="Products"
              >
                {products
                  .filter((_, index) => index < 4)
                  .map((product, index) => {
                    const url = (product.product_url as string).split(
                      '.com',
                    )[1];
                    const key = (product.prod_id ||
                      product.prod_code) as string;
                    return (
                      <li
                        key={key}
                        className={`flex flex-col items-center justify-start ${
                          index > 2 ? 'hidden md:flex md:flex-col' : ''
                        }`}
                        data-product-index={index} // PEAK ACTIVITY Attach index to placeholder image
                        data-item={product.prod_code} // used by useTrackElementInteractions
                      >
                        <Link
                          id={`autocomplete-search-result-${key}`}
                          to={url}
                          prefetch="intent"
                          onClick={() => {
                            toggleDiv();
                            trackSearchClick(
                              xgenClient,
                              query,
                              queryId,
                              deploymentId,
                              product.prod_name,
                              location.search.includes('page=')
                                ? parseInt(location.search.split('page=')[1])
                                : 0,
                            );
                          }}
                          onKeyDown={toggleDiv}
                          className="flex flex-col items-center justify-center gap-2"
                        >
                          {product.image && (
                            <Image
                              crop="center"
                              sizes="100%"
                              aspectRatio="170/227"
                              src={product.image}
                              width={cardSize}
                              loading="eager"
                              data-product-index={index} // PEAK ACTIVITY Attach index to placeholder image
                            />
                          )}
                          {!product.image && (
                            <PlaceholderImage
                              className={`max-w-[${cardSize}px] max-h-[200px]`}
                            />
                          )}
                          <span
                            className={`max-w-[${cardSize}px] text-center text-sm`}
                          >
                            {product.prod_name}
                          </span>

                          {/* Price */}
                          {locale.country === 'US' && (
                            <ProductPrices data={product} />
                          )}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
}
