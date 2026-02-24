import {
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
} from '@remix-run/react';
import {Product} from '@shopify/hydrogen/storefront-api-types';
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from '@shopify/remix-oxygen';
import {SearchGetResultsReturn} from '@xgenai/sdk-core';
import clsx from 'clsx';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import FacetFilters from '~/components/filters/FacetFilters';
import FilterBreadcrumbs from '~/components/filters/FilterBreadcrumbs';
import ResultsPagination from '~/components/filters/ResultsPagination';
import ResultsPerPageSelector from '~/components/filters/ResultsPerPageSelector';
import SortOptions from '~/components/filters/SortOptions';
import {FacetCaret} from '~/components/icons/FacetCaret';
import FacetFiltersIcon from '~/components/icons/FacetFilters';
import {ViewOptionSelectorDouble} from '~/components/icons/ViewOptionSelectorDouble';
import {ViewOptionSelectorSingle} from '~/components/icons/ViewOptionSelectorSingle';
import CioSearchResults from '~/components/search/CioSearchResults';
import {DEFAULT_SORTING} from '~/constants/defaultSorting';
import {useXgenClient} from '~/contexts/XgenClientContext';
import useTrackElementInteractions from '~/hooks/useTrackElementInteractions';
import {validateLocale} from '~/lib/utils';
import {GlobalContext} from '~/lib/utils';
import {DEFAULT_PRODUCT_GRID_NUMBER, loadStatuses} from '~/utils/constants';
import {pushViewSearchQueryXgen} from '~/utils/eventTracking';
import {extractFiltersFromUrl} from '~/utils/extractFiltersFromUrl';
import {extractSortFromUrl, SortParams} from '~/utils/extractSortFromUrl';
//import {pushViewSearchResults} from '~/utils/eventTracking';
//PEAK ACTIVITY ADDITIONS STARTS
import {pushViewSearchResultsNew} from '~/utils/gtmEvents';
import {normalizeAllFacets} from '~/utils/normalizeFacets';
//PEAK ACTIVITY ADDITIONS ENDS
import {getSearchResults} from '~/utils/xgen';

export const SearchFiltersContext = createContext<any>({});

export async function loader({params, context, request}: LoaderFunctionArgs) {
  validateLocale({context, params});
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const query = searchParams.get('q');

  // Load initial search results
  // Need query values for results per page, page number, query
  const cookieHeader = request.headers.get('Cookie');
  const facetFilters = extractFiltersFromUrl(searchParams);
  const sortParams = extractSortFromUrl(searchParams);
  try {
    const initialSearchResults = await getSearchResults(context, {
      query: query || '',
      options: {
        collection: 'default',
        page: searchParams.get('page')
          ? parseInt(searchParams.get('page')!) - 1
          : 0,
        pageSize: searchParams.get('per_page')
          ? parseInt(searchParams.get('per_page')!)
          : DEFAULT_PRODUCT_GRID_NUMBER,
        facets: 'v2',
        ...sortParams,
        context: {
          ...facetFilters,
        },
        deploymentId: context.env.XGEN_DEPLOYMENT_ID!,
      },
    });
    return {
      query,
      initialSearchResults,
      loaderErrorMessage: null,
      facetFilters,
      sortParams,
    };
  } catch (error) {
    let errorMessage;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }
    return {
      query,
      initialSearchResults: null,
      loaderErrorMessage: errorMessage,
      facetFilters,
      sortParams,
    };
  }
}

export default function Search() {
  const {
    initialSearchResults,
    query,
    loaderErrorMessage,
    facetFilters,
    sortParams,
  } = useLoaderData<typeof loader>() as unknown as {
    initialSearchResults: SearchGetResultsReturn; // XGen search results
    query: string;
    loaderErrorMessage: string | null;
    facetFilters: Record<string, string[]>;
    sortParams: SortParams;
  };
  const xgenClient = useXgenClient();
  const {xgenConfig} = useContext(GlobalContext);
  const xgenResponse = initialSearchResults;
  const [facetsMenuIsOpen, setFacetsMenuIsOpen] = useState(false);
  const [resultsPerPage, setResultsPerPage] = useState(
    DEFAULT_PRODUCT_GRID_NUMBER,
  );
  const [resultsPage, setResultsPage] = useState(xgenResponse?.page || 1);
  const [items, setItems] = useState(xgenResponse?.items || []);
  const [loadStatus, setLoadStatus] = useState(loadStatuses.SUCCESS);
  const [sortOptions, setSortOptions] = useState(() =>
    (DEFAULT_SORTING || []).map((item: any) => ({
      ...item,
      id: `${item.sort_by}_${item.sort_order}`,
    })),
  );
  const [facets, setFacets] = useState(
    normalizeAllFacets(xgenResponse?.facets?.[0]?.facets),
  );
  const [groups, setGroups] = useState([]); // XGen doesn't have groups like CIO

  const [totalResults, setTotalResults] = useState(
    xgenResponse?.totalResults || 0,
  );
  const [error, setError] = useState();
  const [products, setProducts] = useState<Product[]>([]);
  const {eventTrackingData} = useContext(GlobalContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  // Set View
  const [view, setView] = useState(0);
  const [activeOption, setActiveOption] = useState('small');

  const searchFiltersContextValues = useMemo(
    () => ({
      groups,
      view,
      items,
      resultsPage,
      resultsPerPage,
      setGroups,
      setFacets,
      setItems,
      setView,
      setResultsPage,
      setSortOptions,
      setTotalResults,
      totalResults,
      facetFilters,
      sortParams,
    }),
    [
      groups,
      view,
      items,
      resultsPage,
      resultsPerPage,
      setFacets,
      setView,
      setGroups,
      setSortOptions,
      totalResults,
      facetFilters,
      sortParams,
    ],
  );

  const toggleFacetsMenu = () => {
    setFacetsMenuIsOpen(!facetsMenuIsOpen);
  };

  const isFirstRender = useRef(true);
  const previousSearchTermRef = useRef<string | null>(null);

  const toggleBigImages = () => {
    setActiveOption('big');
    setView(1);
  };

  const toggleSmallImages = () => {
    setActiveOption('small');
    setView(2);
  };

  // XGen search results are handled server-side, so we don't need client-side fetching
  // The initial results are already loaded in the loader

  const eventFiredRef = useRef<string | null>(null); // Reference to track the last fired query

  useEffect(() => {
    const uniqueKey = `${query}-${totalResults}-${items.length}`; // Create a unique identifier for the current state

    if (query && eventFiredRef.current !== uniqueKey) {
      pushViewSearchQueryXgen(
        xgenClient, // XGEN client might be null.
        query,
        eventTrackingData.customer,
        resultsPage,
      );
      pushViewSearchResultsNew(
        items,
        eventTrackingData.customer,
        eventTrackingData.currency,
        query,
        totalResults,
      );
      // Update the reference to prevent duplicate firing
      eventFiredRef.current = uniqueKey;
    }
  }, [items, query, totalResults, eventTrackingData]);

  //PEAK ACTIVITY ADDITIONS ENDS

  useEffect(() => {
    // this useEffect is here to handle the changing resultsPage variable from pagination
    // prevent this running on first render, we only want it to run while paginating
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    searchParams.set('page', resultsPage.toString());
    navigate(
      {search: searchParams.toString()},
      {replace: true, preventScrollReset: true},
    );
  }, [resultsPage]);

  useEffect(() => {
    // this useEffect is here to handle resetting the resultsPage to 1
    // when the location changes due to a search term. This is to keep the pagination in sync
    if (xgenResponse) {
      setItems(xgenResponse.items || []);
      setTotalResults(xgenResponse.totalResults || 0);
      setFacets(normalizeAllFacets(xgenResponse?.facets?.[0]?.facets));
      setResultsPage(xgenResponse.page + 1);
    }

    // if (searchParams.get('q') !== previousSearchTermRef.current) {
    //   console.log('xgenResponse.page', xgenResponse.page);
    // }
    previousSearchTermRef.current = searchParams.get('q');
    return;
  }, [location.search]);

  // Track element interactions for the search results
  const {ref: searchResultsRef} = useTrackElementInteractions({
    elementId: xgenConfig.deploymentId,
    items: items.map((item) => item.prod_code),
    track: {
      render: false,
      view: false,
      click: true,
    },
    context: {
      query,
      queryId: xgenResponse?.queryId,
      deploymentId: xgenConfig.deploymentId,
      page: resultsPage,
    },
  });

  return (
    <>
      <div className="flex flex-col md:pt-8">
        {/* Breadcrumbs */}
        <FilterBreadcrumbs groups={groups} />

        {/* Decorative Page Title */}
        <h1 className="h1 flex hidden justify-center pb-3 text-center capitalize md:block md:text-[38px]">
          {`Here's What We Found For: "${query}"`}
        </h1>
        <div className="block flex flex-col justify-center  text-center md:hidden">
          <h1 className="flex justify-center pb-3 text-center text-[23px] leading-none">
            {`Here's What We Found For:`}
          </h1>
          <h1 className="text-[23px] capitalize leading-none">{`"${query}"`}</h1>
        </div>
      </div>

      {/* Results Filters */}
      <div
        id="results-filters"
        className="relative ml-auto mr-auto flex-col justify-between px-5 py-2 text-[12px] sm:flex"
      >
        <div className="flex justify-between lg:hidden">
          <button onClick={toggleFacetsMenu}>
            <FacetFiltersIcon />
          </button>
          <div className="flex flex-row items-center gap-x-13">
            {totalResults > 0 && (
              <span>
                {totalResults} {totalResults === 1 ? 'item' : 'items'}
              </span>
            )}
            <div className="flex flex-row items-center gap-x-[10px]">
              <button onClick={toggleBigImages} className="relative md:hidden">
                <span
                  className={
                    activeOption === 'big'
                      ? "after:absolute after:bottom-0 after:left-0 after:block after:h-[1px] after:w-[23px] after:border-t after:border-black after:content-['']"
                      : ''
                  }
                >
                  <ViewOptionSelectorSingle />
                </span>
              </button>
              <button
                onClick={toggleSmallImages}
                className="relative md:hidden"
              >
                <span
                  className={
                    activeOption === 'small'
                      ? "after:absolute after:bottom-0 after:left-0 after:block after:h-[1px] after:w-[23px] after:border-t after:border-black after:content-['']"
                      : ''
                  }
                >
                  <ViewOptionSelectorDouble />
                </span>
              </button>
            </div>
            <div className="flex flex-row items-center gap-x-[10px]">
              Sort
              <FacetCaret />
            </div>
          </div>
        </div>
        <div
          className={`${
            facetsMenuIsOpen
              ? 'absolute bottom-0 left-0 top-full flex h-fit w-full flex-col-reverse bg-white'
              : 'hidden'
          } lg:flex lg:justify-between`}
        >
          {!!facets.length && (
            <FacetFilters
              facetFilters={facetFilters}
              facets={facets}
              totalProducts={totalResults}
            />
          )}
          <div className="hidden lg:flex lg:flex-row">
            <div className="flex flex-row items-center gap-x-[10px] pl-[10px]">
              <span className="whitespace-nowrap">
                {totalResults} item{totalResults === 1 ? '' : 's'}
              </span>
              <span>|</span>
              <div className="flex flex-row gap-x-[10px]">
                <ResultsPerPageSelector
                  totalResults={totalResults}
                  currentResultsPerPage={resultsPerPage}
                  setResultsPerPage={setResultsPerPage}
                />
              </div>
              <SortOptions sortOptions={sortOptions} />
            </div>
          </div>
        </div>
      </div>
      <div className={clsx('mb-32 mt-3')}>
        <SearchFiltersContext.Provider value={searchFiltersContextValues}>
          {/* new cio product grid */}
          {products && (
            <div ref={searchResultsRef}>
              <CioSearchResults products={products} setProducts={setProducts} />
              <ResultsPagination
                resultsPerPage={resultsPerPage}
                totalResults={totalResults}
                resultsPage={resultsPage}
                setResultsPage={setResultsPage}
              />
            </div>
          )}
        </SearchFiltersContext.Provider>
      </div>
    </>
  );
}
